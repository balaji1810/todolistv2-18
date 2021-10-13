const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

mongoose.connect("mongodb+srv://balaji18:test-123@cluster0.rdjgz.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList!"
});

const item2 = new Item({
  name: "Hit the + button to add new items"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", (req, res)=> {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log("Error in adding the item");
          console.log(err);
        }
      });
      res.redirect("/")
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems})
    }
  });

});

app.get("/:customListName", (req,res)=>{
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundLists)=>{
    if(!err){
      if (!foundLists){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", {listTitle: foundLists.name, newListItems: foundLists.items});
      }
    }
  });
});

app.post("/", (req, res)=> {
  var itemName = req.body.newItem;
  var listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, (err, foundList)=>{
      if(!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      } else {
        console.log(err);
      }

    });
  }

});

app.post("/delete", (req, res)=> {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, err =>{
      if (err) {
        console.log("Error in deleting the item");
        console.log(err);
      } else {
        res.redirect("/")
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, { $pull: {items: {_id: checkedItemId}} }, (err, results)=> {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

let port = process.env.PORT;
if (port === null || port === "") {
  port = 3000;
}

app.listen(port, ()=> {
  console.log("Server has started Successfully");
});
