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
        Repair my robot!
      </a>
      <!-- <span> | </span>
      <a href="https://tools.vacuula.phma.dev">
        Vacuula Tools
      </a> -->
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

| Feature          | Status              |   | Feature              | Status |
|------------------|---------------------|---|----------------------|--------|
| Setup/Status     | ✅                   |   | Notifications        | 🚧     |
| Maps             | ✅                   |   | Home Assistant       | 🚧     |
| Historical runs  | ✅                   |   | Drag to clean "here" | 🚧     |
| Schedule         | ✅                   |   | Custom sounds        | 🚧     |
| Settings         | ✅                   |   | QoL improvements      | 🚧     |
| Zones/NoGo Lines | ✅                   |   | "Next day" Schedule  | 🚧     |
| MultiZones       | Gen4 ✅ Gen2/Gen3 🚧 |   |                      |        |

> [!NOTE]
> Do you have an Gen4 robot that is in "$`\color{#A020F0}{\textsf{r}}\color{#802DF6}{\textsf{a}}\color{#6037FA}{\textsf{i}}\color{#403FFD}{\textsf{n}}\color{#2044FE}{\textsf{b}}\color{#0047FF}{\textsf{o}}\color{#3C3EE6}{\textsf{w}}\ \color{#7839D2}{\textsf{m}}\color{#AA37BE}{\textsf{o}}\color{#D23AAF}{\textsf{d}}\color{#FF3FA4}{\textsf{e}}`$"? Different colors flashing and the robot does not start? Contact us in the [discord](https://discord.gg/PAgwhWvyD8). There we can help you repair your robot!


# Repair my robot!

For the repair there is two part
1. [Setup a server](#setup-server) <i>(we are looking into a community server, however that is not done in time for initial release, so you will need to set a server up)</i>
2. [Configure the robot](#configure-the-robot)

## Setup server

Since the server needs to always be on to work properly, you need some dedicated hardware for it. If you do not already have something to run the server on, please read about [hardware on the FAQ](./FAQ.md#dedicated-hardware)

There is many ways to set this server up, if you are using Home Assistant we recommend to use the App Store repo we made, if not using Home Assistant, then Docker Compose is recommended.
We provide you with a couple of ways to setup the server
- [Docker Compose (see below)](#docker-compose)
- As an App in Home Assistant
  - [![Open home assistant app store with link to vacuula repo](https://my.home-assistant.io/badges/supervisor_store.svg)](https://my.home-assistant.io/redirect/supervisor_store/?repository_url=https%3A%2F%2Fgithub.com%2Fvacuula%2Fvacuula)
- [LXC/standalone](./build/lxc/lxc.md)

### Docker compose
1. Install docker
    - <i>This is probably the hardest part for anyone unfamiliar with self-hosting, so we have started writing a [guide in the FAQ](./FAQ.md#install-docker)</i>
2. Download [`docker-compose.yaml`](https://github.com/vacuula/vacuula/releases/latest/docker-compose.yaml) or via `wget https://github.com/vacuula/vacuula/releases/latest/docker-compose.yaml` to save file onto server
3. Run `docker compose up -d`

- The server is configured by [envoriment variables](#configure-server)
- To see logs do `docker compose logs vacuula`
- To stop vacuula `docker compose down`
- To start vacuula `docker compose up -d`
- To permanently remove stored data `docker volume rm vacuula-data` <i>Vacuula needs to be stopped first</i>


## Configure the robot

We have made an easy to use installer to set your robot up!

> Dowload the latest version here for your OS here

| [Windows][windows] | [Linux][linux] | [Mac (M1 and newer)][mac-arm] | [Mac (Intel based)][mac-intel] |
|--------------------|----------------|-------------------------------|--------------------------------|
| Win 10, Win 11     | Debian-based   |                               | 15.4                           |
| Gen3, Gen4         | Gen3, Gen4     |                               | Gen3 (Gen4 does not work)      |

<i>Download by clicking the os link, table shows tested/verified systems</i>

[windows]:   https://github.com/vacuula/installer/releases/latest/download/VacuulaInstaller-windows.exe
[linux]:     https://github.com/vacuula/installer/releases/latest/download/VacuulaInstaller-linux.AppImage
[mac-arm]:   https://github.com/vacuula/installer/releases/latest/download/VacuulaInstaller-macos-arm64.zip
[mac-intel]: https://github.com/vacuula/installer/releases/latest/download/VacuulaInstaller-macos-intel.zip

![Vacuula installer main screen](pics/guide/installer.png)

<i>Source code is available at https://github.com/vacuula/installer</i>
<br><i>If you have an more exotic setup and cannot run this installer in any way - get in touch and we will figure something out!</i>


## Configure server
### Ports used
| Port | Info                                  |
|------|---------------------------------------|
| 80   | Server, Webapp (Customizable)         |
| 443  | Gen3 robots, D3-D7 (Not customizable) |
| 3443 | Gen4 robots, D8-D10 (Customizable)    |

<i>Gen3 robots sadly require port 443, and if enabled, the vacuula server and webapp is also hosted here for PWAs to work </i>

### Configuration
| Option       | Default | Info                                                                                        |
|--------------|---------|---------------------------------------------------------------------------------------------|
| GEN4_PORT    | 3443    | Default port the Gen4 robots will connect to the server on                                  |
| VACUULA_PORT | 80      | Default port that you can reach the webapp/api on                                           |
| GEN3_ENABLED | True    | If server should support for Gen3 robots, can be useful since Gen3 devices require port 443 |
| GEN4_ENABLED | True    | If server should support for Gen4 robots                                                    |
| MDNS_ENABLED | True    | If server should run MDNS for autodiscovering                                               |

### Platform architecture
We have currently only tested and verified on `ARM 64-bit` and `x86 64-bit`. However we want the server to support at least `ARM 32-bit` and possibly `x86 32-bit` as well. We are looking into what we can do to make sure these platforms are also supported. The main reason behind wanting to suppport them is because then the server can run on older SBCs. 
