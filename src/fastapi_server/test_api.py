import requests

def test_with_image(image_path, message="What do you see in this image?"):
    url = "http://localhost:8000/chat-img"
    with open(image_path, "rb") as f:
        files = {"image": (image_path, f, "image/png")}
        data = {"message": message}
        response = requests.post(url, files=files, data=data)
    print("Response:")
    print(response.json())

if __name__ == "__main__":
    # test_with_image("datasets/mock/googlemain.png", "Analyze this image first, After that, make this UI as similar as possible to the image. Make sure to keep the original UI design and Interactive Icon step by step.")
    test_with_image("datasets/mock/spotifyhome.jpg", "Analyze this image first, After that, make this UI as similar as possible to the image.")