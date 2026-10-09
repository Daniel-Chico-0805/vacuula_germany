[buymeacoffee]: https://www.buymeacoffee.com/philip2809
[buymeacoffee-shield]: https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png

<div align="center">
  <img alt="vacuula Logo" src="./pics/logo.svg" width="250">
  <h1>vacuula</h1>
</div>

<div align="center">

_custom server for the undead robot vacuum cleaners_

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V61PBIY6)
[![Buy me a coffee][buymeacoffee-shield]][buymeacoffee]

  <h2>
      <a href="https://discord.gg/PAgwhWvyD8">
        Discord
      </a>
      <span> | </span>
      <a href="#repair-my-robot" style="font-size:32px">
        Repiar my robot!
      </a>
      <span> | </span>
      <a href="https://tools.vacuula.phma.dev">
        Vacuula Tools
      </a>
</div>

> Vacuula is made as an all-in-one solution to repair and control your broken Neato Robot vacuum. 

| Gen1    | Gen2                   | Gen3 | Gen4     |
|---------|------------------------|------|----------|
| No WiFi | BotVac Connected: WIP¹ | D3 ✅ | D800 ✅   |
|         |                        | D4 ✅ | D8     ✅ |
|         |                        | D5 ✅ | D9     ✅ |
|         |                        | D6 ✅ | D10   ✅  |
|         |                        | D7 ✅ |          |

<i>Your robot not listed here? Get in touch!</i>
<br><i>¹Sadly we were not able to fit the OG BotVac Connected into the initial release, sorry about this, support for this robot is in the works and here very soon!</i>

> [!NOTE]
> Do you have an Gen4 robot that is "rainbow-ing"? Different colors flashing and the robot does not start? Contact us in the [discord](https://discord.gg/PAgwhWvyD8). There we can help you repair your robot!

| Feature          | Status              | <br> | Feature              | Status |
|------------------|---------------------|------|----------------------|--------|
| Setup/Status     | ✅                   | <br> | Notifications        | 🚧     |
| Maps             | ✅                   | <br> | Home Assistant       | 🚧     |
| Historical runs  | ✅                   | <br> | Drag to clean "here" | 🚧     |
| Schedule         | ✅                   | <br> | Custom sounds        | 🚧     |
| Settings         | ✅                   | <br> |                      |        |
| Zones/NoGo Lines | ✅                   | <br> |                      |        |
| MultiZones       | Gen4 ✅ Gen3/Gen2 🚧 |      |                      |        |

# Repair my robot!

For the repair there is two part
1. [Setup a server](#setup-server) <i>(we are looking into a community server, however thay is not done in time for initial release, so you will need to set a server up)</i>
2. [Configure the robot](#configure-the-robot)

## Setup server

There is many ways to set this server up, however our recommended way is via Docker Compose. For users looking for standalone/lxc, please see [here](./scripts/lxc.md)

Since the server needs to always be on


## Configure the robot

We have made an easy to use installer to set your robot up!

> Dowload the latest version here for your OS here

| [Windows]() | [Linux]() | [Mac]() |
|---------|-------|-----|

![Vacuula installer main screen](pics/guide/installer.png)

<i>Source code is available at https://github.com/vacuula/installer</i>
<br><i>If you have an more exotic setup and cannot run this installer in any way - get in touch and we will figure something out!</i>
