---
title: Back To The Future
tags:
- ctf
- writeups
- osint
---

| Name               | Description                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Back To The Future | [Delorean](https://b2f.battleof1337.com/) **if only we can see back our pass is it great?** | 

This Osint challenge stated something about "see back our pass" which we need to see the previous version of the web page. WaybackMachine can be used for this purpose. Lets view the web url in [WaybackMaching](https://web.archive.org/). I can see there is only two snapshot of the url available which are on below dates
- 4th July 2022
- 17th July 2022
![[writeup/bo1337-2022/assets/back-to-the-future/draft-back-to-the-future-20220719125344227.png]]

Lets view the oldest one which is 4th of July 2022. The page appears to contains the flag in the contact section of one of the employees, **Jason Bourne**.
![[writeup/bo1337-2022/assets/back-to-the-future/draft-back-to-the-future-20220719125405003.png]]

## Reference
* https://web.archive.org/web/20220704083124/https://b2f.battleof1337.com/