# Invoice dash
Dashboard that generates invoice for clients

#Run api
0 - python -m venv venv
1 - source . ./venv/Scripts/activate
2 - pip install -r requirements.txt
3 - python manage.py migrate
4 - python manage.py createsuperuser
     email = sb365_admin@gov.co.za
     username = sb365_admin
     password = admin@123
5 - python manage.py runserver
