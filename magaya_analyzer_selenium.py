from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import json
import time
import os

def analyze_magaya_login():
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--start-maximized")
    
    # Initialize the Chrome driver
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print("Navigating to Magaya LiveTrack...")
        driver.get("https://tracking.magaya.com/#livetrack")
        
        # Wait for the login form to load
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
        
        print("Login page loaded. Analyzing form structure...")
        
        # Take screenshot of login page
        driver.save_screenshot("magaya_login.png")
        print("Screenshot saved as magaya_login.png")
        
        # Get the entire page HTML
        entire_page_html = driver.page_source
        
        # Save the entire page HTML to a file
        with open("magaya_login_page.html", "w", encoding="utf-8") as f:
            f.write(entire_page_html)
        print("Entire page HTML saved to magaya_login_page.html")
        
        # Get all input fields
        inputs = driver.find_elements(By.TAG_NAME, "input")
        input_details = []
        for inp in inputs:
            input_details.append({
                "type": inp.get_attribute("type"),
                "id": inp.get_attribute("id"),
                "name": inp.get_attribute("name"),
                "placeholder": inp.get_attribute("placeholder"),
                "aria-label": inp.get_attribute("aria-label"),
                "required": inp.get_attribute("required") is not None,
                "visible": inp.is_displayed(),
                "class": inp.get_attribute("class"),
                "xpath": generate_xpath(driver, inp)
            })
        
        # Get submit button
        button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        button_details = {
            "text": button.text.strip(),
            "type": button.get_attribute("type"),
            "id": button.get_attribute("id"),
            "class": button.get_attribute("class"),
            "xpath": generate_xpath(driver, button)
        }
        
        # Get form HTML
        form = driver.find_element(By.TAG_NAME, "form")
        form_html = form.get_attribute("outerHTML")
        
        # Save form details to JSON file
        form_data = {
            "inputs": input_details,
            "button": button_details,
            "form_html": form_html
        }
        
        with open("magaya_login_form.json", "w", encoding="utf-8") as f:
            json.dump(form_data, f, indent=2)
        
        print("Form details saved to magaya_login_form.json")
        
        # Print summary of form fields
        print("\nForm Fields Summary:")
        for i, inp in enumerate(input_details):
            print(f"Field {i+1}: Type={inp['type']}, Placeholder={inp['placeholder']}, Class={inp['class']}")
        
        # Check specifically for Network ID field
        has_network_id = any(inp.get_attribute("placeholder") == "Network ID" for inp in inputs)
        if has_network_id:
            print("\nNOTE: Found Network ID field in the login form. This is required for auto-import.")
        else:
            print("\nWARNING: Network ID field not found. Checking for other potential identifiers...")
            # Try to identify Network ID field by other attributes
            for i, inp in enumerate(inputs):
                if inp.get_attribute("type") == "text" and i == 0:  # First text input might be Network ID
                    print(f"Possible Network ID field: {inp.get_attribute('class')} (First text input)")
        
        print("\nWould you like to attempt a login? (y/n)")
        response = input()
        
        if response.lower() == 'y':
            print("\nEnter Network ID:")
            network_id = input()
            
            print("Enter Username:")
            username = input()
            
            print("Enter Password:")
            password = input()
            
            # Fill in the form
            for inp in inputs:
                placeholder = inp.get_attribute("placeholder")
                if placeholder == "Network ID":
                    inp.send_keys(network_id)
                elif placeholder == "Username":
                    inp.send_keys(username)
                elif inp.get_attribute("type") == "password":
                    inp.send_keys(password)
            
            # Click login button
            button.click()
            
            # Wait for navigation to complete
            try:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='cargo-detail-menu-item']")))
                print("Login successful! Analyzing dashboard...")
                
                # Take screenshot of dashboard
                driver.save_screenshot("magaya_dashboard.png")
                print("Dashboard screenshot saved as magaya_dashboard.png")
                
                # Get the entire dashboard HTML
                dashboard_html = driver.page_source
                
                # Save the entire dashboard HTML to a file
                with open("magaya_dashboard.html", "w", encoding="utf-8") as f:
                    f.write(dashboard_html)
                print("Entire dashboard HTML saved to magaya_dashboard.html")
                
                # Analyze navigation items
                nav_items = driver.find_elements(By.CSS_SELECTOR, "[data-testid*='menu-item']")
                nav_details = []
                for item in nav_items:
                    nav_details.append({
                        "testId": item.get_attribute("data-testid"),
                        "text": item.text.strip(),
                        "xpath": generate_xpath(driver, item)
                    })
                
                # Analyze buttons
                buttons = driver.find_elements(By.CSS_SELECTOR, "button[title]")
                button_details = []
                for btn in buttons:
                    button_details.append({
                        "title": btn.get_attribute("title"),
                        "text": btn.text.strip(),
                        "xpath": generate_xpath(driver, btn)
                    })
                
                # Save dashboard details to JSON file
                dashboard_data = {
                    "nav_items": nav_details,
                    "buttons": button_details
                }
                
                with open("magaya_dashboard.json", "w", encoding="utf-8") as f:
                    json.dump(dashboard_data, f, indent=2)
                
                print("Dashboard details saved to magaya_dashboard.json")
                
                # Print summary of navigation items
                print("\nNavigation Items:")
                for item in nav_details:
                    print(f"- {item['text']} (data-testid={item['testId']})")
                
                print("\nButtons:")
                for btn in button_details:
                    print(f"- {btn['title']}")
                
            except TimeoutException:
                print("Login failed or dashboard elements not found.")
                
                # Capture error page HTML
                error_html = driver.page_source
                with open("magaya_error_page.html", "w", encoding="utf-8") as f:
                    f.write(error_html)
                print("Error page HTML saved to magaya_error_page.html")
                
                # Take screenshot of error page
                driver.save_screenshot("magaya_after_login_attempt.png")
                print("Screenshot saved as magaya_after_login_attempt.png")
                
                # Try to find error messages
                try:
                    error_elements = driver.find_elements(By.CSS_SELECTOR, ".error, .error-message, .alert, .alert-error")
                    if error_elements:
                        print("\nPossible error messages found:")
                        for error in error_elements:
                            print(f"- {error.text.strip()}")
                    else:
                        print("\nNo specific error messages found on page.")
                except:
                    print("Could not analyze error elements.")
        
        print("\nAnalysis complete. Press Enter to exit...")
        input()
        
    finally:
        driver.quit()

def generate_xpath(driver, element):
    """Generate a unique XPath for an element"""
    try:
        return driver.execute_script("""
        function getPathTo(element) {
            if (element.id !== '')
                return 'id("' + element.id + '")';
            if (element === document.body)
                return element.tagName;

            var ix = 0;
            var siblings = element.parentNode.childNodes;
            for (var i = 0; i < siblings.length; i++) {
                var sibling = siblings[i];
                if (sibling === element)
                    return getPathTo(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
                if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                    ix++;
            }
        }
        return getPathTo(arguments[0]);
        """, element)
    except:
        return "XPath generation failed"

if __name__ == "__main__":
    analyze_magaya_login()
