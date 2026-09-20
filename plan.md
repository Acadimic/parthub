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

#########################

1. This is course generator app.
2. Course can contain reference of different courses.
3. Each course can have multiple course modules.
4. Each module can contain multiple test papers, study materials, classes (meets) other fields like attachments etc.
5. Test papers can have multiple sections and subsections. Each section and subsection have multiple questions.
6. Study material can have content (of rich text editor) other fields like attachments etc.
7. Question can have question text (rich text editor content) and options (based on question type).
8. Option can also have rich text editor content.
9. Also we'll have solution/explanation of each question.
10. we'll create plans for each course (by default monthly and yearly).
11. User can purchase plan of each course.
12. We can create plans for combined courses as well.
13. So, I am thinking we can attach language with each course and with its module items.
    Please take reference form acadimic-cloud and acadimic-teaching repos for more details.
    So, now please create a whole structure plan end to end.
    And let me know if you want to add anything here or want to understand anything.

#############################
Hi Claude, I want you to suggest me how to make whole system AI friendly means I want to generate test papers, study materials, courses, schedule classes using AI.
So before making such functionality I want you to verify our Editor. Editor should be very scalable to create or support edit of AI generated content. So, let's work on individual generation part in the test paper, study material, courses page.
Let's first functionality:

1. Generate test paper using AI. Please write a prompt so that I feed this prompt to any of the AI model and it can generate question in JSON files and we can feed this JSON to out system and our system automatically populate these questions in our DB which must be suitable to edit by our editor.
   Whatever we need to feed AI model we can write them in md file or any suitable suggestion you can provide me.
   Our system also need some ids of standard/subject or any extra details so we can keep all these info in the JSON and from the JSON our system insert/update those questions in the DB. Also, we attach tag and level with each question for some extra insight later.
   Also, please use your method to make this generation a very high level (top level) test paper generator.
