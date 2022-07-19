---
title: Streamline
tags:
- writeups
- ctf
- network
---
| Name       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Streamline | We've been investigating Mr. Ridzuan lately, we can feel he's doing some illegal activities. How in the world he can use Lamborghini? He maybe a drug dealer. We successfully captured the packet file of his router. We need your help to crack the wifi password. What we know is he just uses his pet name as the wifi password inluding one symbol that we don't know, and his 4-digit car plate number. Can you get his wifi password? |

## Introduction
For this challenge, we have given an image file named _LamboRidzuan.jpg_ . Below is the image view snippet.
![[writeup/bo1337-2022/assets/streamline/streamline-20220719115950418.png]]
## Stego
Herm... what is the cat doing on top of a blue Lambo? Lets save it for later. First approach when I retrieve a file is to try extract any hidden file with `steghide` command and provide a null password. Luckily, it turns out to be a correct approach, here we have another file called handshake.cap
![[writeup/bo1337-2022/assets/streamline/streamline-20220719120204083.png]]
Lets try to analyze it with [Wireshark](https://www.wireshark.org). 
![[writeup/bo1337-2022/assets/streamline/streamline-20220719120304265.png]]
Looking at the image above, we can see on the right hand-side, there is an SSID value which shows this file is actually a captured packet from a wifi. Wireshark has a built-in feature to parse this informations. Which can be found under `Wireless > WLAN Traffic`
![[writeup/bo1337-2022/assets/streamline/streamline-20220719120500719.png]]
Screenshot above shows that its a captured wifi traffic and based on the question, we need to recover the password for this person. Lets move on into the cracking part
## Cracking Wifi Password
We have been given a password pattern in the question above. Let me break down the password pattern
```
{pet name}{random character}{4-ditgit plate number}
```
This is where it gets a bit tricky since we have no idea what is Mr Ridzuan's pet name. Remember from the image given initially, there is a cat on top of his Lambo? Well thats the pet but whats the name? This is where guessing game comes in play, I remembered from the web challenge [[writeup/bo1337-2022/break-the-storage]] where there is a word oyen which is normally used for cat name in local country. 
### Crafting the Password List
To generate a list of possible password, there are multiple approach to crack the packet capture. You can either use `hashcat` with mask cracking method or use `aircrack-ng` for directly cracking the .cap file. If you prefer hashcat over aircrack-ng, there is an additional steps needed to be done to convert into hashcat cracking format. You can use hashcat-util called `cap2hccapx.bin` located in `/usr/share/hashcat-utils/cap2hccapx.bin`. There is also an online version of it as well which can be found [here](https://hashcat.net/cap2hccapx/)

In my case, i'd like to use `aircrack-ng` approach but we need to craft a wordlist in the first palce before begin crakcing. `crunch` is the perfect tool to generate a wordlist with a pattern. I used the following command to generate the wordlist and output into a file called plate.lst
![[writeup/bo1337-2022/assets/streamline/streamline-20220719121425734.png]]
Cracking with the wordlist returns me a correct hit! 
![[writeup/bo1337-2022/assets/streamline/streamline-20220719121530565.png]]
Below is the flag format 
```
BO1337{oyen@9367}
```