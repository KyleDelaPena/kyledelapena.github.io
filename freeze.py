from flask_frozen import Freezer
from app import app
import mimetypes

# This ensures Windows identifies your CSS correctly so the site looks good
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

app.config['FREEZER_IGNORE_MIMETYPE_WARNINGS'] = True
freezer = Freezer(app)

if __name__ == '__main__':
    print("Freezing the site for GitHub Pages...")
    freezer.freeze()
    print("Done! Your static site is ready in the 'build' folder.")