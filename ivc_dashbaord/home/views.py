from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm
from .forms import UserRegisterForm


#################### index#######################################
def index(request):
	return render(request, 'index.html')

########### register here #####################################
def register(request):
	if request.method == 'POST':
		form = UserRegisterForm(request.POST)
		if form.is_valid():
			form.save()
			username = form.cleaned_data.get('username')
			email = form.cleaned_data.get('email')
			######################### mail system ####################################
			# htmly = get_template('user/Email.html')
			# d = { 'username': username }
			# subject, from_email, to = 'welcome', 'your_email@gmail.com', email
			# html_content = htmly.render(d)
			# msg = EmailMultiAlternatives(subject, html_content, from_email, [to])
			# msg.attach_alternative(html_content, "text/html")
			# msg.send()
			##################################################################
			messages.success(request, f'Your account has been created ! You are now able to log in')
			return redirect('login.html')
	else:
		form = UserRegisterForm()
	return render(request, 'register.html')

################ login forms###################################################
def login(request):
	if request.method == 'POST':

		# AuthenticationForm_can_also_be_used__

		username = request.POST['username']
		password = request.POST['password']
		user = authenticate(request, username = username, password = password)
		if user is not None:
			form = login(request, user)
			messages.success(request, f' welcome {username} !!')
			return redirect('index.html')
		else:
			messages.info(request, f'account done not exit plz sign in')
	form = AuthenticationForm()
	return render(request, 'login.html')
