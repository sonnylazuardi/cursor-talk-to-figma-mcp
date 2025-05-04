import requests

def test_with_image(image_path, message="What do you see in this image?"):
    url = "http://localhost:8000/chat-img"
    with open(image_path, "rb") as f:
        files = {"image": (image_path, f, "image/png")}
        data = {"message": message}
        response = requests.post(url, files=files, data=data)
    print("Response:")
    print(response.json())

def test_get_selection():
    url = "http://localhost:8000/tool/get_selection"
    response = requests.post(url)
    print(response.json())

def test_create_frame():
    url = "http://localhost:8000/tool/create_frame"
    params = {
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1920,
        "name": "test_frame"
    }
    response = requests.post(url, params=params)
    print("Create Frame Response:")
    print(response.json())

def test_create_text_in_root_frame():
    url = "http://localhost:8000/tool/create_text_in_root_frame"
    data = {"text": "This is a test text inside the root frame."}
    response = requests.post(url, data=data)
    print("Create Text in Root Frame Response:")
    print(response.json())

if __name__ == "__main__":
    test_get_selection()
    test_create_frame()
    test_create_text_in_root_frame()
