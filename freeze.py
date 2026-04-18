from flask_frozen import Freezer
from app import app
import mimetypes

mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

freezer = Freezer(app)

if __name__ == '__main__':
    print("Converting Flask app to static HTML...")
    freezer.freeze()
    print("Done! Files generated in the 'build' folder.")
