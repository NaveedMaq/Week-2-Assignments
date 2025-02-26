/**
  You need to create an express HTTP server in Node.js which will handle the logic of a todo list app.
  - Don't use any database, just store all the data in an array to store the todo list data (in-memory)
  - Hard todo: Try to save responses in files, so that even if u exit the app and run it again, the data remains (similar to databases)

  Each todo has a title and a description. The title is a string and the description is a string.
  Each todo should also get an unique autogenerated id every time it is created
  The expected API endpoints are defined below,
  1.GET /todos - Retrieve all todo items
    Description: Returns a list of all todo items.
    Response: 200 OK with an array of todo items in JSON format.
    Example: GET http://localhost:3000/todos
    
  2.GET /todos/:id - Retrieve a specific todo item by ID
    Description: Returns a specific todo item identified by its ID.
    Response: 200 OK with the todo item in JSON format if found, or 404 Not Found if not found.
    Example: GET http://localhost:3000/todos/123
    
  3. POST /todos - Create a new todo item
    Description: Creates a new todo item.
    Request Body: JSON object representing the todo item.
    Response: 201 Created with the ID of the created todo item in JSON format. eg: {id: 1}
    Example: POST http://localhost:3000/todos
    Request Body: { "title": "Buy groceries", "completed": false, description: "I should buy groceries" }
    
  4. PUT /todos/:id - Update an existing todo item by ID
    Description: Updates an existing todo item identified by its ID.
    Request Body: JSON object representing the updated todo item.
    Response: 200 OK if the todo item was found and updated, or 404 Not Found if not found.
    Example: PUT http://localhost:3000/todos/123
    Request Body: { "title": "Buy groceries", "completed": true }
    
  5. DELETE /todos/:id - Delete a todo item by ID
    Description: Deletes a todo item identified by its ID.
    Response: 200 OK if the todo item was found and deleted, or 404 Not Found if not found.
    Example: DELETE http://localhost:3000/todos/123

    - For any other route not defined in the server return 404

  Testing the server - run `npm run test-todoServer` command in terminal
 */
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;

class Todo {
  static #filePath = path.join(__dirname, 'todo.json');
  constructor({ id, title, description, completed = false }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = completed;
  }

  generateUniqueId() {
    return (this.id = Math.floor(
      Math.random() * 9_999_999_999 + 1_000_000_000
    ).toString());
  }

  async persist() {
    const allTodos = await Todo.fetchAll();
    this.generateUniqueId();
    allTodos.push(this);
    await Todo.writeJSON(allTodos);
    return allTodos;
  }

  static async update(id, { title, description, completed }) {
    const allTodos = await this.fetchAll();
    const todoIndex = allTodos.findIndex(todo => todo.id === id);

    if (todoIndex < 0) throw new Error('Todo Not Found');
    const todo = allTodos[todoIndex];

    if (title) todo.title = title;
    if (description) todo.description = description;
    todo.completed = completed ? true : false;

    await this.writeJSON(allTodos);
    return todo;
  }

  static async delete(id) {
    const allTodos = await this.fetchAll();
    const todoIndex = allTodos.findIndex(todo => todo.id === id);

    if (todoIndex < 0) throw new Error('Todo Not Found');
    allTodos.splice(todoIndex, 1);
    await this.writeJSON(allTodos);
  }

  static async fetchById(id) {
    const allTodos = await this.fetchAll();
    const todo = allTodos.find(todo => todo.id === id);

    if (!todo) throw new Error('Todo Not Found');

    return todo;
  }

  static async fetchAll() {
    try {
      const fileContent = await fs.readFile(Todo.#filePath, 'utf-8');
      const allTodos = JSON.parse(fileContent);

      return allTodos;
    } catch (err) {
      console.error(err);
      const writtenData = await this.writeJSON([]);
      return writtenData;
    }
  }

  static async writeJSON(json) {
    const jsonString = JSON.stringify(json, null, 4);
    await fs.writeFile(Todo.#filePath, jsonString);
    return json;
  }
}

const app = express();

app.use(bodyParser.json());

// 1.GET /todos - Retrieve all todo items
app.get('/todos', (req, res) => {
  Todo.fetchAll()
    .then(todos => res.status(200).json(todos))
    .catch(err => {
      console.error(err);
      res.sendStatus(500);
    });
});

// 2.GET /todos/:id - Retrieve a specific todo item by ID
app.get('/todos/:id', (req, res) => {
  const { id } = req.params;
  Todo.fetchById(id)
    .then(todo => {
      res.status(200).json(todo);
    })
    .catch(err => {
      console.error(err);
      res.status(404).send(err.message);
    });
});

// 3. POST /todos - Create a new todo item
app.post('/todos', (req, res) => {
  const todo = new Todo(req.body);

  todo
    .persist()
    .then(() => res.status(201).json({ id: todo.id }))
    .catch(err => {
      console.error(err);
      return res.status(500);
    });
});

// 4. PUT /todos/:id - Update an existing todo item by ID
app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const updatedTodo = req.body;
  Todo.update(id, updatedTodo)
    .then(todo => {
      res.status(200).json(todo);
    })
    .catch(err => {
      console.error(err);
      res.sendStatus(404);
    });
});

// 5. DELETE /todos/:id - Delete a todo item by ID
app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  Todo.delete(id)
    .then(() => {
      res.sendStatus(200);
    })
    .catch(err => {
      console.error(err);
      res.sendStatus(404);
    });
});

// - For any other route not defined in the server return 404
app.use((req, res) => res.status(404).send('Route Not Found'));

// app.listen(3000, () => console.log('Server started on port 3000'));
module.exports = app;
