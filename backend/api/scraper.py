from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import re
import time
import os


class Scraper:

    @staticmethod
    def scrape_herkey_jobs(url="https://www.herkey.com/jobs", wait_time=30):
        """
        Scrapes job listings from the HerKey jobs page using Selenium in Colab.

        Args:
            url (str): The URL of the HerKey jobs page.
            wait_time (int): Maximum time in seconds to wait for job cards to load.

        Returns:
            list: A list of dictionaries, where each dictionary represents a job.
                Returns an empty list if the page cannot be fetched or parsed.
        """
        jobs_list = []

        # Setup Chrome options for Colab
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # MUST be headless in Colab
        # MUST run sandboxed in Colab
        chrome_options.add_argument("--no-sandbox")
        # Overcomes limited resource problems
        chrome_options.add_argument("--disable-dev-shm-usage")
        # Often needed for headless
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36")  # Set a user agent

        driver = None
        try:
            print("Initializing WebDriver for Colab...")
            try:
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(
                    service=service, options=chrome_options)
                print("WebDriver initialized successfully.")
            except Exception as webdriver_init_error:
                print(
                    f"Error initializing WebDriver via ChromeDriverManager: {webdriver_init_error}")
                print("Attempting fallback using default chromedriver path...")
                try:
                    # Common path after apt install
                    service = Service('/usr/bin/chromedriver')
                    driver = webdriver.Chrome(
                        service=service, options=chrome_options)
                    print("WebDriver initialized successfully using fallback path.")
                except Exception as fallback_error:
                    print(
                        f"Fallback WebDriver initialization failed: {fallback_error}")
                    print("Cannot start Selenium driver. Exiting.")
                    return []

            print(f"Navigating to {url}...")
            driver.get(url)

            job_card_selector = '[data-test-id="job-details"]'
            print(
                f"Waiting up to {wait_time} seconds for job cards with selector '{job_card_selector}'...")

            try:
                wait = WebDriverWait(driver, wait_time)
                wait.until(EC.presence_of_all_elements_located(
                    (By.CSS_SELECTOR, job_card_selector)))
                print("Job cards detected. Allowing a brief moment for full render...")
                # Give it 3 seconds extra for JS rendering inside cards
                time.sleep(3)
            except Exception as e:
                print(f"Timeout or error waiting for job cards: {e}")
                print("Attempting to parse anyway, but might miss jobs or fail.")
                try:
                    driver.save_screenshot("screenshot_wait_failed.png")
                    print("Saved screenshot_wait_failed.png")
                except Exception as ss_error:
                    print(f"Could not save screenshot: {ss_error}")

            print("Getting rendered page source...")
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'lxml')  # Use lxml parser

            job_cards = soup.find_all(
                'div', attrs={'data-test-id': 'job-details'})

            if not job_cards:
                print(
                    "No job cards found even in the Selenium-rendered source. Check rendered_source.html (if saved) or screenshot.")
                return []

            print(f"Found {len(job_cards)} job cards in rendered source.")

            for card in job_cards:
                job_data = {}
                job_data['source'] = "HerKey"  

                # Extract Title
                title_tag = card.find('p', attrs={'data-test-id': 'job-title'})
                job_data['title'] = title_tag.text.strip(
                ) if title_tag else 'N/A'

                # Extract Company
                company_tag = card.find(
                    'p', attrs={'data-test-id': 'company-name'})
                company_name_raw = company_tag.text.strip() if company_tag else 'N/A'
                job_data['company'] = re.sub(
                    r'^Client of\s*', '', company_name_raw).strip()

                # Extract Details (Location, Mode, Experience)
                details_container = card.find(
                    'div', class_=lambda x: x and 'css-14ldegz' in x)
                location, work_mode, experience = 'N/A', 'N/A', 'N/A'
                location_exp_tag = None
                if details_container:
                    company_div = details_container.find(
                        'div', class_=lambda x: x and 'css-70qvj9' in x)
                    if company_div:
                        next_div = company_div.find_next_sibling('div')
                        if next_div and next_div.find('p'):
                            location_exp_tag = next_div.find('p')

                if location_exp_tag:
                    details_text = location_exp_tag.text.strip()
                    parts = [p.strip() for p in details_text.split('|')]
                    if len(parts) == 3:
                        location = parts[0]
                        work_mode = parts[1]
                        experience = parts[2]
                    elif len(parts) == 2:
                        location = parts[0]
                        if re.search(r'\d+\s*-\s*\d+\s*Yr|\d+\s*Yr', parts[1], re.IGNORECASE):
                            experience = parts[1]
                        else:
                            work_mode = parts[1]
                    elif len(parts) == 1:
                        location = parts[0]

                job_data['location'] = location
                job_data['work_mode'] = work_mode
                job_data['experience'] = experience

                # Extract Skills
                skills_tag = None
                if location_exp_tag and location_exp_tag.parent:
                    skills_parent_div = location_exp_tag.parent.find_next_sibling(
                        'div')
                    if skills_parent_div and skills_parent_div.find('span'):
                        skills_tag = skills_parent_div.find('span')

                job_data['skills'] = []
                if skills_tag:
                    skills_raw = skills_tag.text.strip()
                    skills_list = [re.sub(r'\s*\+\d+$', '', s).strip()
                                   for s in skills_raw.split('•') if s.strip()]
                    job_data['skills'] = skills_list

                # Extract Company Logo
                logo_img = card.find(
                    'img', class_=lambda x: x and 'css-mtfjwr' in x)
                if not logo_img:
                    logo_container = card.find(
                        'div', attrs={'data-test-id': 'company-logo'})
                    if logo_container:
                        logo_img = logo_container.find('img')
                job_data['company_logo_url'] = logo_img['src'] if logo_img and 'src' in logo_img.attrs else 'N/A'

                # Extract Apply Button Text
                apply_button = card.find(
                    'button', attrs={'data-test-id': 'apply-job'})
                job_data['apply_button_text'] = apply_button.text.strip(
                ) if apply_button else 'N/A'

                # Extract Tags
                tags = []
                chip_tags = card.find_all(
                    'div', class_=lambda x: x and 'MuiChip-root' in x)
                for chip in chip_tags:
                    label = chip.find(
                        'span', class_=lambda x: x and 'MuiChip-label' in x)
                    if label:
                        tags.append(label.text.strip())
                job_data['tags'] = tags

                if job_data['title'] != 'N/A' and job_data['company'] != 'N/A':
                    jobs_list.append(job_data)

        except Exception as e:
            print(f"An error occurred during scraping: {e}")
        finally:
            if driver:
                print("Closing WebDriver...")
                driver.quit()
        return jobs_list
