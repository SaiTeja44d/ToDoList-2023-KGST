//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");
const app = express();
const cors = require("cors");

dotenv.config();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cors());
mongoose.set('strictQuery', true);


const userDbURI = `mongodb+srv://ksaiteja456:${process.env.MONGODB_PASSWORD}@cluster0.cpzrd0q.mongodb.net/Users?retryWrites=true&w=majority`;
const userDbOptions = { useNewUrlParser: true, useUnifiedTopology: true };
let db1;

try {
  db1 = mongoose.createConnection(userDbURI, userDbOptions);
  console.log("Mongoose is connected with Users DB");
} catch (e) {
  console.log("could not connect");
  throw e; 
}

const userSchema = mongoose.Schema({
  name : String,
  password : String
});
const User = db1.model("User",userSchema);


const createDB = async function (name) {
  mongoose.connection.close(function () {
    console.log('Mongoose connection is closed.');
  });
  const uri = `mongodb+srv://ksaiteja456:${process.env.MONGODB_PASSWORD}@cluster0.cpzrd0q.mongodb.net/${name}?retryWrites=true&w=majority`;
  try {
    await mongoose.connect(uri,{ useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Mongoose is connected with your individual DB");

  } catch (e) {
    console.log("could not connect");
    throw e; 
  }
}

const taskSchema = mongoose.Schema({
  name : String
})
const Task = mongoose.model("Task",taskSchema)

const task1 = new Task({
  name:"Welcome to the todoList"
})
const task2 = new Task({
  name:"Add your Daily Tasks"
})
const task3 = new Task({
  name:"<-- Click here to remove task"
})
const defaultTasks = [task1,task2,task3]

const listSchema = {
  name : String,
  tasks : [taskSchema]
}

const List = mongoose.model("List",listSchema);


app.get("/", function(req, res) {
  res.render("login");
  // Task.find({}, function(err,foundTasks){
  //   if(foundTasks.length === 0){
  //     Task.insertMany(defaultTasks,function(err){
  //       if(err) console.log(err);
  //       else console.log("Succesfully Inserted default Items");
  //     })
  //     res.redirect("/")
  //   }
  //   else{
  //     res.render("list", {listTitle: "TODAY", newListItems: foundTasks});
  //   }
  // });
});

app.post("/login", async function (req, res) {
  const userName = _.capitalize(req.body.userName);
  const curPassword = req.body.password;
  let fl = true;

  try {
    const foundUser = await User.findOne({ name: userName }).exec();

    if (!foundUser) {
      const newUser = new User({
        name: userName,
        password: curPassword,
      });
      await newUser.save();
    } else if (foundUser.password !== curPassword) {
      console.log("Wrong Password");
      fl = false;
      return res.redirect("/");
    }

    if (fl) {
      await createDB(userName);
      return res.redirect(`/${userName}`);
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send('Internal Server Error');
  }
});



app.get("/:custom",function(req,res){
  //console.log(req.params.custom)
  const curList = _.capitalize(req.params.custom);
  List.findOne({name: curList},function(err,foundList){
    if(err) console.log(err);
    else {
      if(!foundList){
        const list = new List({
          name : curList,
          tasks : defaultTasks
        })
        list.save()
        res.redirect("/"+ curList);
      }
      else{
        res.render("list",{listTitle : curList, newListItems:foundList.tasks})
      }
    }
  });
});

// app.post("/login",async function (req, res) {
//   const userName = req.body.userName;
//   const curPassword = req.body.password;
//   let fl = true;
//   await User.findOne({name:userName}, (err,foundUser)=>{
//     if(err){
//       console.log("Error in Finding");
//       return res.redirect("/");
//     }
//     //console.log(foundUser);
//     if(!foundUser){
//       const newUser = new User({
//         name : userName,
//         password : curPassword
//       });
//       newUser.save();
//     }

//     else if(foundUser.password !== curPassword){
//       console.log("Wrong PassWord");
//       fl = false;
//       res.redirect("/");
//     }
//   });

//   if(fl){
//     try {
//       await createDB(userName);
//       res.redirect(`/${userName}`);
//     } catch (error) {
//       console.error('Error:', error);
//       return res.status(500).send('Internal Server Error'); // Handle the error appropriately
//     }
//   }
//   else res.redirect("/");
// });

app.post("/addTask", function(req, res){

  const newTask = req.body.newTask;
  const curList = req.body.list;

  const task = new Task({
    name : newTask
  })
  // if(curList === "TODAY"){
  //   task.save(function(err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log("Successfully Inserted new Item");
  //     }
  //   });
  //   res.redirect("/")
  // }
  // else{
    List.findOne({name:curList},function(err,foundList){
      foundList.tasks.push(task)
      foundList.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Inserted new Item");
        }
      });
      res.redirect("/"+curList)
    })
  // }
});

app.post("/delete",function(req,res){
  
  const id = req.body.checkbox;
  const curList = req.body.listName;
  // if (curList === "TODAY"){
  //   Task.findByIdAndRemove(id, function(err){
  //     if(!err){
  //       res.redirect("/")
  //       console.log("Succesfully deleted")
  //     }
  //   })
  // }
  // else{
  List.findOneAndUpdate({name: curList}, {$pull: {tasks: {_id: id}}}, function(err, foundList){
    if (!err){
      res.redirect("/" + curList);
    }
  })
  // }
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});;
