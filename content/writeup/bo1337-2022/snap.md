---
title: Snap
tags:
- writeups
- ctf
- osint
---
| Name | Description                                                                              |
| ---- | ---------------------------------------------------------------------------------------- |
| Snap | keep stalking maybe you will find some else quick queestion what is kilogram minus kilo? |

## Introduction
This challenge is a continuation from the previous Instagram Osint challenge [[writeup/bo1337-2022/1gram]], where we require to crawl between profiles to obtain the full flag. In this challenge we have to look into these profile images since they are all look kinda same. So the overview for this challenge, we require to arrange the images to form a full image and we need to guess the place location. 

## Being the Geolocating
Lets first piece up the puzzle of images. Lets download all images from the given profiles. We can  arrange them in canva.com. Here is the pieces that I can piece up together. 
![[writeup/bo1337-2022/assets/snap/snap-20220719155955500.png]]

Doing the reverse image lookup with Google Images, it turns out to be Monorail Imbi and after few attempts of guessing the flag. The flag is `BO1337{Imbi}`