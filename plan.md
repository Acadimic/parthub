Now, let's add user flow. As of we should have 4 type of users in an org.
1. Admin (Org wise)
2. Teacher
3. Assistant
4. Student
But this should we scalable and later user can add multiple roles and their permissions.

Now, each role should have some default permissions.

Let's talk about sign-up.

1. Admin sign-up:
a. When any user comes to the teaching platform then user can do a sign-up and create their account.
b. After choosing email/password or sign-in with google or any other option we first create firebase user.
c. After creating firebase user we can call our backend api to get some initials data. (This should be a first api call)
d. In the first API call (say GET /users) we can check whether the user is present in the our database with exact admin/teacher/assistant role.
e. If user present we can send all users and orgs in the api.
f. If user is not present then we should first register user (create user, create user org, add some demo data etc.)
g. After that we should return initial data.

Note: Using a single email (firebase UID) user can present in the teaching dashboard or learning dashboard. Also teacher can belong to multiple organizations or create multiple orgs with different roles.
Student can belong to multiple orgs as well.

Case:
1. If user is not present then context would have empty data, right? Then if we know user is not present in the db then we can add dummy context values in the request context and then use these values in the signup service. So that we would have one consistent flow.

Let me know if you find any other findings.