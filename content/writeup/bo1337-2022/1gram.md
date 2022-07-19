---
title: 1Gram
tags:
- writeups
- ctf
- osint
---
| Name  | Description                                                |
| ----- | ---------------------------------------------------------- |
| 1Gram | you might have missed something here..,do it for the gram! | 

This is related to the previous challenge [[writeup/bo1337-2022/back-to-the-future]] since it uses the same web portal but this time it has something to with Instagram Osint skills. We were given a link to the same web page but this time there is an interesting email in the source. 
![[writeup/bo1337-2022/assets/1gram/1gram-20220719154620751.png]]

We can see that it has something related to Instagram. Lets look at @mikrahazura account on Instagram. 
![[writeup/bo1337-2022/assets/1gram/1gram-20220719154721889.png]]

Now we have a sequence of images that looks like the flag format. Looking into each files shows that we have another tagged profile. 
![[writeup/bo1337-2022/assets/1gram/1gram-20220719154809144.png]]

Looking into each account and we can now form a flag. Account associated with the flag are as follows
- https://www.instagram.com/mikrahazura/
- https://www.instagram.com/melisahalib/
- https://www.instagram.com/nuraliahariz/
```
BO1337{S74LK_4P4_7U?}
```