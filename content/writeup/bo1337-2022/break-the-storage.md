---
title: Break The Storage
tags:
- ctf
- writeups
- ctf-web
---
This is a web challenge that shows the impact of a hard-coded credential which can be used by attackers to login as authenticated user on the web page. So lets begin, the page presents with a login panel which includes username and password field. Upon entering invalid password, I was prompted that I have nth number of left attempt. Here is the response once we entered an invalid credential. 
![[writeup/bo1337-2022/assets/break-the-storage/Pasted image 20220719081735.png]]
This got me thinking, how does the password got validated without having to redirect to any page/endpoint upon logging in. Its only getting the XHR request which is embedded in client-side javascript. This can be shown in the network tab
![[writeup/bo1337-2022/assets/break-the-storage/Pasted image 20220719081742.png]]
Lets inspect the javascript content embdeded in index.js file and beutify the output with js beautifier (can be found online). Here's the interesting bit of the code.
![[writeup/bo1337-2022/assets/break-the-storage/Pasted image 20220719082126.png]]
This means that the valid password is stored in normalUser object which we can directly call from the console tab on the webpage. Lets do it and see the results
![[writeup/bo1337-2022/assets/break-the-storage/Pasted image 20220719082256.png]]
Here we have a valid pair of credentials. Now we are able to login as an authenticated user context. Now viewing profile.js from profile.html we redirected after login. We have a flag hardcoded in the profile.js. 
![[writeup/bo1337-2022/assets/break-the-storage/Pasted image 20220719083034.png]]

## Takeaway
The crucial vulnerabilities that allows us to login as an unauthenticated user are the hard-coded credentials which both username and password are being stored in index.js file and also the client-side validation. This is obviosly not a best practise to be implemented in real-world scenario. However, for every problems, there must be a solution right? So how do we "safely" do this? First suggestion is to perform credential validation on the server-side where end users supposedly shouldn't be able to have access at all. This would pretty much solve the issue and passwords/secrets shouldn't be hard-coded anywhere in the code as well. 