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
    def _initialize_driver():
        """Initializes and returns a Selenium WebDriver for Colab."""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36")

        driver = None
        print("Initializing WebDriver for Colab...")
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            print("WebDriver initialized successfully via ChromeDriverManager.")
            return driver
        except Exception as webdriver_init_error:
            print(f"Error initializing WebDriver via ChromeDriverManager: {webdriver_init_error}")
            print("Attempting fallback using default chromedriver path...")
            try:
                service = Service('/usr/bin/chromedriver') # Common path after apt install
                driver = webdriver.Chrome(service=service, options=chrome_options)
                print("WebDriver initialized successfully using fallback path.")
                return driver
            except Exception as fallback_error:
                print(f"Fallback WebDriver initialization failed: {fallback_error}")
                print("Cannot start Selenium driver.")
                return None

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
        driver = Scraper._initialize_driver()
        if not driver:
            return []

        try:
            print(f"Navigating to {url}...")
            driver.get(url)

            job_card_selector = '[data-test-id="job-details"]'
            print(f"Waiting up to {wait_time} seconds for job cards with selector '{job_card_selector}'...")

            try:
                wait = WebDriverWait(driver, wait_time)
                wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, job_card_selector)))
                print("Job cards detected. Allowing a brief moment for full render...")
                time.sleep(3) # Give it extra time for JS rendering inside cards
            except Exception as e:
                print(f"Timeout or error waiting for job cards: {e}")
                print("Attempting to parse anyway, but might miss jobs or fail.")
                try:
                    driver.save_screenshot("screenshot_wait_failed_jobs.png")
                    print("Saved screenshot_wait_failed_jobs.png")
                except Exception as ss_error:
                    print(f"Could not save screenshot: {ss_error}")

            print("Getting rendered page source for jobs...")
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'lxml')

            job_cards = soup.find_all('div', attrs={'data-test-id': 'job-details'})

            if not job_cards:
                print("No job cards found in the Selenium-rendered source.")
                # Optionally save the source for debugging
                # with open("rendered_source_jobs.html", "w", encoding="utf-8") as f:
                #     f.write(page_source)
                # print("Saved rendered_source_jobs.html for debugging.")
                return []

            print(f"Found {len(job_cards)} job cards in rendered source.")

            for card in job_cards:
                job_data = {}
                job_data['source'] = "HerKey"  

                # Extract Title
                title_tag = card.find('p', attrs={'data-test-id': 'job-title'})
                job_data['title'] = title_tag.text.strip() if title_tag else 'N/A'

                # Extract Company
                company_tag = card.find('p', attrs={'data-test-id': 'company-name'})
                company_name_raw = company_tag.text.strip() if company_tag else 'N/A'
                job_data['company'] = re.sub(r'^Client of\s*', '', company_name_raw).strip()

                # --- Extract Details (Location, Mode, Experience) ---
                # Re-evaluating selectors based on potential variations
                location, work_mode, experience = 'N/A', 'N/A', 'N/A'
                details_p = card.select_one('div > div > p:-soup-contains("|")') # Heuristic: look for p tag with pipe separators
                if not details_p: # Fallback to class-based - CAREFUL, classes might change
                    details_div = card.find('div', class_=lambda x: x and 'css-14ldegz' in x) # Example class, might need adjustment
                    if details_div:
                        company_div = details_div.find('div', class_=lambda x: x and 'css-70qvj9' in x)
                        if company_div:
                             next_div = company_div.find_next_sibling('div')
                             if next_div:
                                 details_p = next_div.find('p')

                if details_p:
                    details_text = details_p.text.strip()
                    parts = [p.strip() for p in details_text.split('|')]
                    if len(parts) >= 1: location = parts[0]
                    if len(parts) >= 2:
                        # Try to determine if part 2 is mode or experience
                        if re.search(r'Yr|Year|Exp', parts[1], re.IGNORECASE):
                            experience = parts[1]
                        else:
                            work_mode = parts[1]
                    if len(parts) >= 3:
                         # If part 2 wasn't experience, assume part 3 is
                         if experience == 'N/A':
                             experience = parts[2]
                         # If part 2 wasn't work mode, assume part 3 is (less likely)
                         elif work_mode == 'N/A':
                             work_mode = parts[2]


                job_data['location'] = location
                job_data['work_mode'] = work_mode
                job_data['experience'] = experience

                # Extract Skills
                skills_tag = card.select_one('span:-soup-contains("•")') # Heuristic: Look for span with bullet separators
                job_data['skills'] = []
                if skills_tag:
                    skills_raw = skills_tag.text.strip()
                    skills_list = [re.sub(r'\s*\+\d+$', '', s).strip() for s in skills_raw.split('•') if s.strip()]
                    job_data['skills'] = skills_list

                # Extract Company Logo
                logo_img = card.find('img', class_=lambda x: x and 'css-mtfjwr' in x)
                if not logo_img:
                    logo_container = card.find('div', attrs={'data-test-id': 'company-logo'})
                    if logo_container:
                        logo_img = logo_container.find('img')
                job_data['company_logo_url'] = logo_img.get('src', 'N/A') if logo_img else 'N/A'


                # Extract Apply Button Text
                apply_button = card.find('button', attrs={'data-test-id': 'apply-job'})
                job_data['apply_button_text'] = apply_button.text.strip() if apply_button else 'N/A'

                # Extract Tags (Chips)
                tags = []
                chip_tags = card.find_all('div', class_=lambda x: x and 'MuiChip-root' in x)
                for chip in chip_tags:
                    label = chip.find('span', class_=lambda x: x and 'MuiChip-label' in x)
                    if label:
                        tags.append(label.text.strip())
                job_data['tags'] = tags

                if job_data['title'] != 'N/A' and job_data['company'] != 'N/A':
                    jobs_list.append(job_data)

        except Exception as e:
            print(f"An error occurred during job scraping: {e}")
            import traceback
            traceback.print_exc() # Print full traceback for debugging
        finally:
            if driver:
                print("Closing WebDriver for jobs...")
                driver.quit()
        return jobs_list

    @staticmethod
    def scrape_herkey_events(url="https://events.herkey.com/events", wait_time=30):
        """
        Scrapes event listings from the HerKey events page using Selenium in Colab.

        Args:
            url (str): The URL of the HerKey events page.
            wait_time (int): Maximum time in seconds to wait for event cards to load.

        Returns:
            list: A list of dictionaries, where each dictionary represents an event.
                Returns an empty list if the page cannot be fetched or parsed.
        """
        events_list = []
        driver = Scraper._initialize_driver()
        if not driver:
            return []

        try:
            print(f"Navigating to {url}...")
            driver.get(url)

            # Selector for the individual event cards based on the provided HTML
            event_card_selector = 'div.event-details-card'
            print(f"Waiting up to {wait_time} seconds for event cards with selector '{event_card_selector}'...")

            try:
                wait = WebDriverWait(driver, wait_time)
                # Wait for at least one card to be present
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, event_card_selector)))
                print("Event cards detected. Allowing a brief moment for full render...")
                time.sleep(3) # Extra time for potential JS rendering inside cards
            except Exception as e:
                print(f"Timeout or error waiting for event cards: {e}")
                print("Attempting to parse anyway, but might miss events or fail.")
                try:
                    driver.save_screenshot("screenshot_wait_failed_events.png")
                    print("Saved screenshot_wait_failed_events.png")
                except Exception as ss_error:
                    print(f"Could not save screenshot: {ss_error}")

            print("Getting rendered page source for events...")
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'lxml')

            # Find all event cards using the class selector
            event_cards = soup.find_all('div', class_='event-details-card')

            if not event_cards:
                print("No event cards found in the Selenium-rendered source.")
                 # Optionally save the source for debugging
                # with open("rendered_source_events.html", "w", encoding="utf-8") as f:
                #     f.write(page_source)
                # print("Saved rendered_source_events.html for debugging.")
                return []

            print(f"Found {len(event_cards)} event cards in rendered source.")

            for card in event_cards:
                event_data = {}

                # Extract Event ID (from the span id inside the card)
                id_span = card.find('span', id=True)
                event_data['id'] = id_span.get('id', 'N/A') if id_span else 'N/A'

                # Extract Event Image/Logo
                logo_img = card.find('img', class_='card-logo-img')
                event_data['image_url'] = logo_img.get('src', 'N/A') if logo_img else 'N/A'

                # Extract Event Title and URL
                title_link = card.find('a', class_='card-heading')
                if title_link:
                    # Clean title text (remove potential featured icon text if needed, although .text usually handles it)
                    title_text = title_link.text.strip()
                    # Remove trailing whitespace potentially left by removed elements
                    event_data['title'] = re.sub(r'\s+', ' ', title_text).strip()
                    event_data['event_url'] = title_link.get('href', 'N/A')
                else:
                    event_data['title'] = 'N/A'
                    event_data['event_url'] = 'N/A'

                # Extract Categories
                categories = []
                category_div = card.find('div', class_='card-body-data', style=lambda s: s and 'padding-left: 15px' in s)
                if category_div:
                     # Find the image with tag.png to be more specific
                     tag_img = category_div.find('img', src=lambda s: s and 'tag.png' in s)
                     if tag_img and tag_img.parent:
                         category_links = tag_img.parent.find_all('a')
                         categories = [a.text.strip() for a in category_links if a.text]
                event_data['categories'] = categories

                # --- Extract Details from the left column (col-8) ---
                details_col = card.find('div', class_='col-8')
                event_data['mode'] = 'N/A'
                event_data['date'] = 'N/A'
                event_data['time'] = 'N/A'
                event_data['venue'] = 'N/A'

                if details_col:
                    # Mode (Online/Offline) - Look for the bullseye icon
                    mode_span = details_col.find('span', class_='mr-1')
                    if mode_span and mode_span.find('i', class_='fa-bullseye'):
                        event_data['mode'] = mode_span.text.strip()

                    # Date - Look for calendar icon
                    date_img = details_col.find('img', src=lambda s: s and 'calendar' in s)
                    if date_img and date_img.parent:
                         # Get text from the parent div, strip whitespace and the implicit image alt text/nbsp
                         date_text = date_img.parent.text.strip()
                         event_data['date'] = re.sub(r'\s+', ' ', date_text).strip()


                    # Time - Look for clock icon
                    time_img = details_col.find('img', src=lambda s: s and 'clock.png' in s)
                    if time_img and time_img.parent:
                         time_text = time_img.parent.text.strip()
                         event_data['time'] = re.sub(r'\s+', ' ', time_text).strip()

                    # Venue/Location - Look for placeholder icon
                    venue_img = details_col.find('img', src=lambda s: s and 'placeholder.svg' in s)
                    if venue_img and venue_img.parent:
                         venue_text = venue_img.parent.text.strip()
                         event_data['venue'] = re.sub(r'\s+', ' ', venue_text).strip()


                # --- Extract Details from the right column (col-4) ---
                action_col = card.find('div', class_='col-4')
                event_data['price'] = 'N/A'
                event_data['original_price'] = 'N/A'
                event_data['register_url'] = 'N/A'
                event_data['interested_url'] = 'N/A' # Optional

                if action_col:
                    # Price
                    price_tag = action_col.find('p', class_='free-btn semibold')
                    if price_tag and '₹' in price_tag.text: # Check for currency symbol
                        event_data['price'] = price_tag.text.strip()

                    # Original Price (Strikethrough)
                    original_price_tag = action_col.find('p', class_='free-btn', style=lambda s: s and 'line-through' in s)
                    if original_price_tag and '₹' in original_price_tag.text:
                        event_data['original_price'] = original_price_tag.text.strip()

                    # If no price found, check if it might be implicitly free (e.g., only Register button)
                    if event_data['price'] == 'N/A' and action_col.find('button', class_='register'):
                         # Check if any text like "Free" exists explicitly
                         free_text_tag = action_col.find(lambda tag: tag.name == 'p' and 'free' in tag.text.lower())
                         if free_text_tag:
                             event_data['price'] = 'Free'
                         # else: remain N/A or assume Free? Let's keep N/A for now unless specified.

                    # Register Button URL
                    register_button = action_col.find('button', class_='register')
                    if register_button:
                        register_link_tag = register_button.find_parent('a')
                        if register_link_tag:
                            event_data['register_url'] = register_link_tag.get('href', 'N/A')

                    # Interested Button URL (Optional)
                    interested_button = action_col.find('button', class_='interested-btn')
                    if interested_button:
                        interested_link_tag = interested_button.find_parent('a')
                        if interested_link_tag:
                            event_data['interested_url'] = interested_link_tag.get('href', 'N/A')


                # Add the extracted data to the list
                # Basic validation: Ensure at least a title or ID was found
                if event_data['title'] != 'N/A' or event_data['id'] != 'N/A':
                    events_list.append(event_data)

        except Exception as e:
            print(f"An error occurred during event scraping: {e}")
            import traceback
            traceback.print_exc() # Print full traceback for debugging
        finally:
            if driver:
                print("Closing WebDriver for events...")
                driver.quit()
        print(events_list)        
        return events_list
