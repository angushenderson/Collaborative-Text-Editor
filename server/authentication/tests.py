from django.test.client import Client
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import User


class AuthorizationTests(APITestCase):
    USERNAME: str = 'ach_henderson'
    PASSWORD: str = 'you_should_totally_follow_me_on_twitter_:)'

    def login(self):
        """
        Helper function (with inbuilt tests) to fetch a token pair
        """
        data = {
            'username': self.USERNAME,
            'password': self.PASSWORD,
        }

        response = self.client.post('/api/auth/token/', data)
        self.assertTrue('refresh' in response.content)
        self.assertTrue('access' in response.content)
        print(response.content)
        return response.content

    def test_create_account(self):
        """
        Ensure we can create a new account. 
        """
        data = {
            'username': self.USERNAME,
            'password': self.PASSWORD,
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        # Status code test
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # User object created
        self.assertEqual(User.objects.count(), 1)
        # Username matches that which was posted
        self.assertEqual(User.objects.get().username, data['username'])
        # Check for Authorization and refresh tokens in cookies
        self.assertTrue('Authorization' in response.cookies)
        self.assertTrue('refresh' in response.cookies)

    def test_set_profile_picture(self):
        """
        Ensure image uploading is working as expected
        """
        client = Client()
        with open('media/profile-pictures/default-profile-picture.jpg', 'r') as img:
            response = client.post(
                '/api/auth/my-account/', {'profile-picture': img})
        self.assertEqual(response.status_code, 200)
        self.assertTrue('profile-picture' in response.content)
        self.assertEqual('username', None)

    def test_create_account_with_invalid_data(self):
        """
        Ensure the API catches invalid data.
        """
        # No password field
        data = {
            'username': self.USERNAME,
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check that created field doesn't return True
        self.assertNotEqual(response.json().get('created', None), True)
