
import threading
import gen3.init 
import gen4.init
import handlers.init
from handlers.setup import MDNSAdvertiser, ensure_ssl_certificate

# welcome to the source code for vacuula. sorry for it being a mess, a cleanup effort is on the way.
# the big unexpected differances between the robot generations and wanting to release something as fast as
# possible has resulted in this. Please don't judge to hard lol
# some major todos i have in mind that i come to think of writing this:
# - better logging system for what is going on

if __name__ == "__main__":
    ensure_ssl_certificate()
    threading.Thread(target=gen3.init.start, daemon=True).start()
    threading.Thread(target=gen4.init.start, daemon=True).start()
    threading.Thread(target=handlers.init.start, daemon=True).start()

    mdns = MDNSAdvertiser()
    mdns.start()

    try:
        while True:
            threading.Event().wait(1)
    except KeyboardInterrupt:
        print("Server stopping")
    finally:
        mdns.stop()
        print("Server stopped")

