import requests
import time
from bs4 import BeautifulSoup
import json
import os

def analyze_magaya_login():
    """
    A simple script to analyze the Magaya login page structure
    """
    print("Analyzing Magaya LiveTrack login page...")
    
    # URL of the Magaya LiveTrack login page
    url = "https://tracking.magaya.com/#livetrack"
    
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        
        # Check if the request was successful
        if response.status_code == 200:
            print(f"Successfully fetched the page (Status code: {response.status_code})")
            
            # Save the raw HTML content
            with open("magaya_login_raw.html", "w", encoding="utf-8") as f:
                f.write(response.text)
            print("Raw HTML saved to magaya_login_raw.html")
            
            # Parse the HTML content
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all forms on the page
            forms = soup.find_all('form')
            print(f"Found {len(forms)} form(s) on the page")
            
            form_data = []
            
            # Analyze each form
            for i, form in enumerate(forms):
                form_info = {
                    "form_index": i,
                    "form_id": form.get('id', ''),
                    "form_class": form.get('class', ''),
                    "form_action": form.get('action', ''),
                    "form_method": form.get('method', ''),
                    "inputs": []
                }
                
                # Find all input elements in the form
                inputs = form.find_all('input')
                print(f"Form {i} has {len(inputs)} input field(s)")
                
                # Analyze each input
                for input_elem in inputs:
                    input_info = {
                        "type": input_elem.get('type', ''),
                        "id": input_elem.get('id', ''),
                        "name": input_elem.get('name', ''),
                        "placeholder": input_elem.get('placeholder', ''),
                        "class": input_elem.get('class', ''),
                        "required": input_elem.get('required') is not None
                    }
                    form_info["inputs"].append(input_info)
                    
                    # Print input field details
                    print(f"  - Input: Type={input_info['type']}, Placeholder={input_info['placeholder']}")
                
                # Find submit buttons
                buttons = form.find_all('button')
                form_info["buttons"] = []
                
                for button in buttons:
                    button_info = {
                        "type": button.get('type', ''),
                        "id": button.get('id', ''),
                        "class": button.get('class', ''),
                        "text": button.text.strip()
                    }
                    form_info["buttons"].append(button_info)
                    print(f"  - Button: Type={button_info['type']}, Text={button_info['text']}")
                
                form_data.append(form_info)
            
            # Save form data to JSON file
            with open("magaya_login_analysis.json", "w", encoding="utf-8") as f:
                json.dump(form_data, f, indent=2)
            print("Form analysis saved to magaya_login_analysis.json")
            
            # Check for Network ID field
            network_id_found = False
            for form_info in form_data:
                for input_info in form_info["inputs"]:
                    if input_info["placeholder"] == "Network ID":
                        network_id_found = True
                        print("\nNOTE: Found Network ID field in the login form.")
                        break
            
            if not network_id_found:
                print("\nWARNING: Network ID field not found by placeholder.")
                print("Looking for other potential identifiers...")
                
                # Try to identify first text input in each form
                for form_info in form_data:
                    text_inputs = [inp for inp in form_info["inputs"] if inp["type"] == "text"]
                    if text_inputs:
                        print(f"First text input in form {form_info['form_index']}:")
                        print(f"  - ID: {text_inputs[0]['id']}")
                        print(f"  - Name: {text_inputs[0]['name']}")
                        print(f"  - Class: {text_inputs[0]['class']}")
                        print(f"This might be the Network ID field.")
            
        else:
            print(f"Failed to fetch the page. Status code: {response.status_code}")
    
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    analyze_magaya_login() 