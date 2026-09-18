
import threading
import gen3.init 
import gen4.init
import handlers.init
from handlers.setup import MDNSAdvertiser

if __name__ == "__main__":
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

