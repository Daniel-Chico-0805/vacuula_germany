[buymeacoffee]: https://www.buymeacoffee.com/philip2809
[buymeacoffee-shield]: https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png

<div align="center">
  <img alt="vacuula Logo" src="https://github.com/vacuula/vacuula/raw/main/pics/logo.svg" width="250">
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
      <a href="https://github.com/vacuula/vacuula#repair-my-robot" style="font-size:32px">
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
> Do you have an Gen4 robot that is in "<span style="color: #A020F0;">r</span><span style="color: #802DF6;">a</span><span style="color: #6037FA;">i</span><span style="color: #403FFD;">n</span><span style="color: #2044FE;">b</span><span style="color: #0047FF;">o</span><span style="color: #3C3EE6;">w</span> <span style="color: #7839D2;">m</span><span style="color: #AA37BE;">o</span><span style="color: #D23AAF;">d</span><span style="color: #FF3FA4;">e</span>"? Different colors flashing and the robot does not start? Contact us in the [discord](https://discord.gg/PAgwhWvyD8). There we can help you repair your robot!







## Ports used
| Port | Info                                  |
|------|---------------------------------------|
| 80   | Server, Webapp (Customizable)         |
| 443  | Gen3 robots, D3-D7 (Not customizable) |
| 3443 | Gen4 robots, D8-D10 (Customizable)    |

<i>Gen3 robots sadly require port 443, and if enabled, the vacuula server and webapp is also hosted here for PWAs to work </i>





## Configuration
| Option       | Default | Info                                                                                        |
|--------------|---------|---------------------------------------------------------------------------------------------|
| GEN4_PORT    | 3443    | Default port the Gen4 robots will connect to the server on                                  |
| VACUULA_PORT | 80      | Default port that you can reach the webapp/api on                                           |
| GEN3_ENABLED | True    | If server should support for Gen3 robots, can be useful since Gen3 devices require port 443 |
| GEN4_ENABLED | True    | If server should support for Gen4 robots                                                    |
| MDNS_ENABLED | True    | If server should run MDNS for autodiscovering                                               |