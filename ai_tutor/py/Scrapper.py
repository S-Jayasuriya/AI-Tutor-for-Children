from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

# Function to search for YouTube videos
def search_youtube_videos(query, max_results=3):
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    service = Service('C:/chromedriver/chromedriver.exe')  # Adjust path to your chromedriver
    driver = webdriver.Chrome(service=service, options=chrome_options)

    driver.get("https://www.youtube.com")

    search_box = driver.find_element(By.NAME, "search_query")
    search_box.send_keys(query)
    search_box.send_keys(Keys.RETURN)

    time.sleep(2)  # Allow time for results to load

    videos = driver.find_elements(By.ID, "video-title")[:max_results]
    results = [(video.get_attribute("title"), video.get_attribute("href")) for video in videos]
    
    # Define the keyword for the YouTube video URL
    keyword = "https://www.youtube.com/watch?v="
    links = [video.get_attribute("href").split(keyword)[1] for video in videos]
    cleaned_links = [link.split("&pp")[0] for link in links]

    driver.quit()

    return [f'https://www.youtube.com/embed/{link}' for link in cleaned_links] if results else []

# Function to extract video links from a page using a keyword
def extract_video_links(keyword):
    page_url = f"https://elearn.tnschools.gov.in/etb/{keyword}"

    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    service = Service('C:/chromedriver/chromedriver.exe')  # Adjust path to your chromedriver
    driver = webdriver.Chrome(service=service, options=chrome_options)

    driver.get(page_url)

    time.sleep(2)  # Allow time for results to load

    # Find all video tags
    video_tags = driver.find_elements(By.TAG_NAME, 'video')
    video_links = [video.get_attribute('src') for video in video_tags]

    driver.quit()

    return list(set(video_links))  # Remove duplicate links