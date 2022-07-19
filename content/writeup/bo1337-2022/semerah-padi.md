---
title: Semerah Padi
tags:
- writeups
- ctf
- network
---
| Name         | Description                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Semerah Padi | Mat Kilau inspected our logs and found someone downloading a file from a machine within the same network. | 

## Introduction
Here comes the networking challenge, we were given a *pcap* file named *flaghere.pcap* and lets try inspect the traffic with a traffic analyser tool called [Wireshark](https://www.wireshark.org). From the pcap file, I can see that there are not many traffic available which made my scope smaller and easier. From the list of traffics, there is only one HTTP request made with an endpoint /Flag. 
![[writeup/bo1337-2022/assets/semerah-padi/semerah-padi-20220719113137271.png]]

## Finding Needle in a Haystack
Lets try to view the packet in details by right-clicking on the packet and click on `Follow > HTTP Stream` and you should be presented with a human readable strings. From the parsed output, we can see the request made with a red highlight and response with a blug highlight. 
![[writeup/bo1337-2022/assets/semerah-padi/semerah-padi-20220719113349885.png]]

I went through the huge text. Like literally the whole text :'). Luckily, I saw a URL look alike string as shown in the following screenshot. This looks like a scrambled characters and we might need to reconstruct the characters to form a valid url.
![[writeup/bo1337-2022/assets/semerah-padi/semerah-padi-20220719113447031.png]]

This took me quite a while to understand the pattern but the pattern is break down into two parts of the url
![[writeup/bo1337-2022/assets/semerah-padi/semerah-padi-20220719114247073.png]]

I need to take a character from the red box and then follow with a character from the yellow box and the step goes on until we can form a url. Below is the recovered URL that successfully retrieved.
```
https://pastebin.com/5WNzAUve
```
Accessing the Pastebin site, we have two urls from the [raw paste](https://pastebin.com/raw/5WNzAUve). Both url is a url to download two sound format mp3 and wav. Lets try to download both.

## Hidden in Plain Sight
I mostly used `sonic-visualizer` to analyze sound because of its multiple features and functionality. The flag can be found in the spectogram view.
![[writeup/bo1337-2022/assets/semerah-padi/semerah-padi-20220719114837010.png]]

Below is the flag found in the spectogram view.
![[writeup/bo1337-2022/assets/semerah-padi/semerah-padi-20220719114642797.png]]

