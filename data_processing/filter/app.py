#create web server, handling HTTP requests, sending JSON responses
from flask import Flask, request, jsonify
from scheduler import generate_schedule
from scheduler import find_courses

app = Flask(__name__)

# CORS implementation without flask-cors
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

#just checking if the server is working
@app.route('/ping')
def ping():
    return "hello this server is working yeah"

#backend api endpoint for frontend to call

#get endpoint
@app.route('/search/<department>', methods=['GET', 'OPTIONS'])
def search_courses(department):
    if request.method == 'OPTIONS':
        return '', 204

    result = find_courses(department)

    return jsonify({
        "success": True,
        "result": result
    }), 200 # 200 stands for OK


@app.route('/preferences', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "no data can be provided"
        }), 400 #400 is for bad requests


    course_list = data.get("course_list")
    CRN_list = data.get("CRN_list")
    hard_breaks = data.get("hard_breaks")
    soft_preferences = data.get("soft_preferences")

    print(f"DEBUG: Received course_list: {course_list}")
    print(f"DEBUG: Received CRN_list: {CRN_list}")
    print(f"DEBUG: Received hard_breaks type: {type(hard_breaks)}, length: {len(hard_breaks) if hard_breaks else 'None'}")
    print(f"DEBUG: Received soft_preferences: {soft_preferences}")

    top_ten_schedules = generate_schedule(course_list, CRN_list, hard_breaks, soft_preferences)

    print(f"DEBUG: Generated {len(top_ten_schedules)} schedules")

    return jsonify({
        "success": True,
        "schedules": top_ten_schedules
    }), 201 #201 is HTTP status code for "created"


if __name__ == '__main__':
    app.run(debug=True, port=5001)
