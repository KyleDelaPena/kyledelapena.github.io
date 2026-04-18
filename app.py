from flask import Flask, render_template
app = Flask(__name__)
app.config['FREEZER_DESTINATION_IGNORE'] = ['.git*', 'CNAME']
app.config['FREEZER_RELATIVE_URLS'] = True

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/experience')
def experience():
    return render_template('experience.html')

if __name__ == '__main__':
    app.run(debug=True)