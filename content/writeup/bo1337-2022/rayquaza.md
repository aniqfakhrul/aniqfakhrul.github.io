---
title: Rayquaza
tags:
- ctf
- writeups
- misc
---
| Name      | Description                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Rayquanza | I dont know How but.. i think the fat guy know something... maybe he has eaten your answer... good god |
## Introduction
This challenge requires us to use a GameBoy Emulator to run the given file. This gace me a hard time since its been a while since the last time I have used the emulator. But this challange definitely gave me a sweet good ol time throwback moment. So lets get started.

## Back to the 90's
We have been given a file named **1337Pikachu** and checking the file type with `file` command on linux shows it is a "Game Boy Advance ROM Image"
![[writeup/bo1337-2022/assets/rayquaza/rayquaza-20220719105804594.png]]
To run this ROM image, we need an emulator to load this image. There is a publicly available GBA Emulator on [Github](https://github.com/visualboyadvance-m/visualboyadvance-m). Download the release version for any preferred os and architecture version.

Open the 1337Pikachu file with GBA emulator and expect this error.
![[writeup/bo1337-2022/assets/rayquaza/rayquaza-20220719110436687.png]]

This happens because it doesn't have any valid extension for a valid ROM image. Hence, lets give it a `.gba` extension and we are able to load the image now. Perfect!
![[writeup/bo1337-2022/assets/rayquaza/rayquaza-20220719110651422.png]]
This next steps are a bit time consuming since I need to actually play the game to get the flag. Lets skip to a scene where I retrieved the flag by talking to a random person in the game.
![[writeup/bo1337-2022/assets/rayquaza/rayquaza-20220719110812354.png]]