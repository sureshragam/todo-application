const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join("todoApplication.db");

let db = null;

// DATE VALIDATION

const dateValidation = (request, response, next) => {
  let { date } = request.query;
  console.log(date);
  let dateValid = null;
  if (date === undefined) {
    date = request.body.dueDate;
    if (date === undefined) {
      dateValid = true;
    } else {
      dateValid = isValid(new Date(date));
    }
  } else {
    dateValid = isValid(new Date(date));
  }

  if (dateValid) {
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

// GET VALIDATION

const getValidation = (request, response, next) => {
  const { status = "", priority = "", category = "" } = request.query;
  const possibleValues = [
    "",
    "HIGH",
    "MEDIUM",
    "LOW",
    "TO DO",
    "IN PROGRESS",
    "DONE",
    "WORK",
    "HOME",
    "LEARNING",
  ];
  let isStatusValid = true;
  let isPriorityValid = true;
  let isCategoryValid = true;
  for (let wor of possibleValues) {
    if (status === wor) {
      isStatusValid = false;
    }
    if (priority === wor) {
      isPriorityValid = false;
    }
    if (category === wor) {
      isCategoryValid = false;
    }
  }
  if (isStatusValid) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (isPriorityValid) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (isCategoryValid) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    next();
  }
};

// POST VALIDATION

const postValidation = (request, response, next) => {
  const { status = "", priority = "", category = "" } = request.body;
  const possibleValues = [
    "",
    "HIGH",
    "MEDIUM",
    "LOW",
    "TO DO",
    "IN PROGRESS",
    "DONE",
    "WORK",
    "HOME",
    "LEARNING",
  ];
  let isStatusValid = true;
  let isPriorityValid = true;
  let isCategoryValid = true;
  for (let wor of possibleValues) {
    if (status === wor) {
      isStatusValid = false;
    }
    if (priority === wor) {
      isPriorityValid = false;
    }
    if (category === wor) {
      isCategoryValid = false;
    }
  }
  if (isStatusValid) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (isPriorityValid) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (isCategoryValid) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    next();
  }
};

// get /todos/ API

app.get("/todos/", getValidation, async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  try {
    const todosQuery = `
        SELECT id,todo,priority,status,category,due_date AS dueDate
        FROM Todo
        WHERE status LIKE '%${status}%' AND
        priority LIKE '%${priority}%'AND
        todo LIKE '%${search_q}%'AND
        category LIKE '%${category}%'
        `;
    const todosDetails = await db.all(todosQuery);
    response.send(todosDetails);
  } catch (e) {
    console.log(e.message);
  }
});

// GET /todos/:todoId/ API

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  try {
    const todoQuery = `
        SELECT id,todo,priority,status,category,due_date AS dueDate
        FROM Todo
        WHERE id = ${todoId}
        `;
    const todoDetails = await db.get(todoQuery);
    response.send(todoDetails);
  } catch (e) {
    console.log(e.message);
  }
});

// GET /agenda/ API

app.get("/agenda/", dateValidation, async (request, response) => {
  let { date = "" } = request.query;
  if (date !== "") {
    date = format(new Date(date), "yyyy-MM-dd");
  }
  console.log(date);
  try {
    const todosQuery = `
            SELECT id,todo,priority,status,category,
            due_date AS dueDate
            FROM Todo
            WHERE due_date LIKE '%${date}%'
            `;
    const todosDetails = await db.all(todosQuery);
    response.send(todosDetails);
  } catch (e) {
    console.log(e.message);
  }
});

// POST  /todos/ API

app.post(
  "/todos/",
  postValidation,
  dateValidation,
  async (request, response) => {
    const { id, todo, priority, status, category } = request.body;
    const { dueDate } = request.body;
    const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
    console.log(formattedDate);

    try {
      const addTodoQuery = `
        INSERT INTO Todo (id,todo,priority,status,category,due_date)
        VALUES (
            ${id},
            '${todo}',
            '${category}',
            '${priority}',
            '${status}',
            '${formattedDate}'
        )
        `;
      await db.run(addTodoQuery);
      response.send("Todo Successfully Added");
    } catch (e) {
      console.log(e.message);
    }
  }
);

//  PUT /todos/:todoId/ API

app.put(
  "/todos/:todoId/",
  postValidation,
  dateValidation,
  async (request, response) => {
    const { todoId } = request.params;
    let columnChange = null;
    let value = null;
    switch (true) {
      case request.body.status !== undefined:
        columnChange = "status";
        value = request.body.status;
        break;
      case request.body.priority !== undefined:
        columnChange = "priority";
        value = request.body.priority;
        break;
      case request.body.todo !== undefined:
        columnChange = "todo";
        value = request.body.todo;
        break;
      case request.body.category !== undefined:
        columnChange = "category";
        value = request.body.category;
        break;
      case request.body.dueDate !== undefined:
        columnChange = "due_date";
        value = request.body.dueDate;
        break;
    }
    try {
      const updateTodoQuery = `
        UPDATE todo
        SET
            ${columnChange} = '${value}'
        WHERE id = ${todoId}
        `;
      await db.run(updateTodoQuery);
      if (columnChange === "due_date") {
        columnChange = "Due Date";
      } else {
        columnChange =
          columnChange.charAt(0).toUpperCase() + columnChange.slice(1);
      }
      const output = `${columnChange} Updated`;
      response.send(output);
    } catch (e) {
      console.log(e.message);
    }
  }
);

// DELETE /todos/:todoId/ API

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  try {
    const deleteQuery = `
        DELETE 
        FROM Todo
        WHERE id = ${todoId}
        `;
    await db.run(deleteQuery);
    response.send("Todo Deleted");
  } catch (e) {
    console.log(e.message);
  }
});

const initializeServerAndConnectDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server started at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeServerAndConnectDatabase();

module.exports = app;
