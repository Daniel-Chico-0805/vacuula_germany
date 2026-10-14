



## Dedicated hardware?
Since the server needs to be running all the time, you need some dedicated hardware to run it on. If you have an old computer laying around, that is an perfect candicate for just that, however if you find it hard to set something like that up or don't have any hardware we recommend to pick up a small SBC (Single Board Computer). Examples of these are:
- Raspberry Pi
- Rock Pi
- Orange Pi

For the initial release, buy hardware that is at least 64-bit, for using raspberry pi for reference this is from Raspberry Pi 3 Model B and newer (or some revisions of older ones). If you are unsure about what to get or if what you have found will work - ask us! Also, we are working on removing this limitation, just something now for the initial release!
Now these are just a couple of examples, and if you have an hard time finding or knowing what to buy, send us a message here on github or in the discord and we will happily help you! If you include your region we can even send you links to what you could buy.

The second hand market has a lot of these SBCs for cheap, and if you have any questions or issues, feel free to ask!

## Install docker
<i>Not had time to finish this yet, will update later but until this here is a link to what I think is a more easy to follow guide then the docker official one</i>
https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-debian-10


## Checking connection to internet?? 
Currently all robots require internet to reach `pool.ntp.org` to set the time correctly. With the next update we plan to include an small ntp compatible time-endpoint so that a connection to `pool.ntp.org` is not needed. 

- Gen4 (D800-D10) only have the `pool.ntp.org` dependency, we plan on fixing with next update.
- Gen3 (D3-D7) robots also need internet for the ip lookup and an firmware made internet check. To understand how these work, please read below.

> [!NOTE]
> Gen3 robots fetch the ip of your server correctly via [nip.io](nip.io). Because of the way the robot works, if you enter an private ip it behaves as if it were in development, because of this nip.io is used to make an hostname into an ip (`vacuula-local-192-168-1-123` --> `192.168.1.123`). This requirement can be eliminated by hosting your own nip.io instance, and we plan on including this with a future release of Vacuula, however that also requires us to figure out the DNS. nip.io is open source and the only data sent to their servers is the DNS request, all other data from the robot goes directly to your server.

> [!NOTE]
> Gen3 robots have an firmware bound internet check to `8.8.8.8` (Google DNS). Sadly, this is not easy to disable in the firmware (we are looking into what we can do that way), however you can bypass it by rewriting 8.8.8.8 requests to your own DNS for the ip of the robot (advanced users)

## Install as an App in Home Assistant
[Home Assistant guide on "Installning a third-party app repository"](https://www.home-assistant.io/common-tasks/os/#installing-a-third-party-app-repository)

[![Open home assistant app store with link to vacuula repo](https://my.home-assistant.io/badges/supervisor_store.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fvacuula%2Fvacuula)

If you used this button, click "Add" and then you can skip to step 11!

1. Open Home Assistant page (usually [`homeassistant.local:8123`](homeassistant.local:8123)).
2. Go to `Settings` --> `Apps` (older versions it was called `Add-ons`).
3. Click on the blue `Install app` button in right bottom corner.
4. Click on the 3-dot menu in right top corner.
5. Select `Repositories` (middle option).
6. Click on the blue `Add` button in right bottom corner.
7. Enter `https://github.com/vacuula/vacuula` as the URL.
8. Click blue `Add` button in the popup - make sure it was added in the list!
9. Click on the back arrow in the top left corner and you should be back on the `App store` page.
10. Click on the 3-dot menu in right top corner and select `Check for updates` (first option).
11. Scroll until you find `Vacuula` or use the searchbar and search `Vacuula`. 
12. Click on `Vacuula` and then select `Install app`
13. Once installed, click `Start`. 
14. Once started, you can always come to this page to `Stop` or `Restart`

In the top-bar you can: 
- change configuration by clicking on `Configuration`
- View the logs by clicking on `Log`
