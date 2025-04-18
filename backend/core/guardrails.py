import logging
import warnings
from models.data_model import BiasDetection
logging.getLogger("presidio-analyzer").setLevel(logging.ERROR)

warnings.filterwarnings("ignore")

from typing import Callable, Dict, Optional
from guardrails.validators import (
    FailResult,
    PassResult,
    register_validator,
    ValidationResult,
    Validator,
)
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import TransformersNlpEngine
from presidio_anonymizer import AnonymizerEngine
from langchain_google_genai import ChatGoogleGenerativeAI

@register_validator(name="detect-pii", data_type="string")
class CustomDetectPII(Validator):
    def __init__(
            self,
            score_threshold: float = None,
            entities : list = ["PHONE_NUMBER", "EMAIL_ADDRESS", "PERSON", "CRYPTO", "ID", "IP_ADDRESS"],
            spacy_model_name: str = "en_core_web_sm",
            transformer_model_name: str = "StanfordAIMI/stanford-deidentifier-base",
            on_fail: Optional[Callable] = None
            ):
        super().__init__(on_fail=on_fail, score_threshold=score_threshold)

        self.score_threshold = score_threshold
        self.entities = entities
        self.model_config = [{"lang_code": "en", "model_name": {
              "spacy": spacy_model_name,
              "transformers": transformer_model_name
            }
        }]
        self.nlp_engine = TransformersNlpEngine(models=self.model_config)
        self.analyzer = AnalyzerEngine(nlp_engine=self.nlp_engine)
        self.anonymizer = AnonymizerEngine()

    def _validate(self, value: str, metadata: Dict) -> ValidationResult:
        if self.score_threshold is not None:
          result = self.analyzer.analyze(text=value, language='en', entities= self.entities, score_threshold=self.score_threshold)
        else:
          result = self.analyzer.analyze(text=value, language='en', entities=self.entities)
        anonymized_text = self.anonymizer.anonymize(text=value, analyzer_results=result)
        if value==anonymized_text.text:
            return PassResult()
        else:
            return FailResult(
                error_message=f"The following text contains PII:\n{value}",
                fix_value= anonymized_text.text
            )


@register_validator(name="detect-bias", data_type="string")
class CustomDetectBias(Validator):
    def __init__(self, bias_threshold: int=70, model='gemini-2.0-flash', on_fail: Optional[Callable] = None):
        super().__init__(on_fail=on_fail, bias_threshold=bias_threshold)
        self.llm = ChatGoogleGenerativeAI(model= model)
        self.structured_llm = self.llm.with_structured_output(BiasDetection)
        self.bias_threshold = bias_threshold
        self.SYSTEM_PROMPT = """
            You are a bias detection expert tasked with performing tasked exclusively with identifying and analyzing gender bias within content relevant to the Asha AI Chatbot initiative. This chatbot is developed for the JobsForHer Foundation platform, which is dedicated to empowering women in their professional journeys. Your objective is to thoroughly examine any given text (e.g., user queries) to detect potential gender-based bias or insensitive language.
            Gender Bias Detection:
            - Identify Bias: Examine the text for overt or subtle gender bias. Analyze language use, assumptions, and context that may marginalize, stereotype, or disadvantage any gender, with a special focus on women.
            - Analysis: Clearly indicate the location and nature of any identified bias, explaining why such language or assumptions might be considered biased in the context of inclusivity. Include a severity assessment score between 0 to 100 indicating the level of bias and potential harm or negative impact on user engagement.
            - Recommendations: Provide suggestions for alternative, gender-neutral phrasing and strategies for ensuring ethical, inclusive AI responses.
            Consider this context in your analysis: the chatbot is designed to support women in exploring careers, job listings, community events, mentorship programs, and professional networking. It must provide factual, positive, and inclusive information while mitigating any potential biases.
        """


    def _llm_callable(self, messages):
        return self.structured_llm.invoke(messages)

    def _validate(self, value: str, metadata: Dict) -> ValidationResult:
        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": value,
            }
        ]
        response = self._llm_callable(messages)
        bias_detected = response.bias_detected
        bias_score = response.bias_score
        bias_response = response.response
        if bias_detected:
          if bias_score > self.bias_threshold:
              return FailResult(
                  error_message=f"Bias detected in the user query with a score {bias_score}.",
                  fix_value = bias_response
              )
          else:
              return PassResult()
        else:
            return PassResult()