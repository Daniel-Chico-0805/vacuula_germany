
import threading
import gen3.init 
import gen4.init

if __name__ == "__main__":
    threading.Thread(target=gen3.init.start, daemon=True).start()
    threading.Thread(target=gen4.init.start, daemon=True).start()

    try:
        while True:
            threading.Event().wait(1)
    except KeyboardInterrupt:
        print("Server stopped")




