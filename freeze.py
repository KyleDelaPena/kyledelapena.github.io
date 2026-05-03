from flask_frozen import Freezer
from app import SKILLS, app
import mimetypes

# Fix for Windows MIME type identification
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

app.config['FREEZER_IGNORE_MIMETYPE_WARNINGS'] = True

freezer = Freezer(app)

@freezer.register_generator
def skill_detail():
    for skill in SKILLS:
        yield {"slug": skill["slug"]}

if __name__ == '__main__':
    print("Freezing the site for GitHub Pages...")
    freezer.freeze()
    print("Done! Your static site is ready in the 'build' folder.")
