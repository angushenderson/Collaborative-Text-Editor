from rest_framework import status
from rest_framework.test import APITestCase
from api.models import User


class RegistrationTests(APITestCase):
    def test_create_account(self):
        """
        Ensure we can create a new account. 
        """
        data = {
            'email': 'test@admin.com',
            'password': 'my_super_secure_password_456',
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        print(response.json())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, data['email'])
