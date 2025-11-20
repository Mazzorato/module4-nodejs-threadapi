import { loadSequelize } from "./database.mjs";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { DataTypes } from "sequelize";

/**
 * Point d'entrée de l'application
 * Vous déclarer ici les routes de votre API REST
 */
async function main() {
    try {
        const sequelize = await loadSequelize();
        const User = sequelize.models.User;
        const Post = sequelize.models.Post;
        const Comment = sequelize.models.Comment;
        const app = express();

        app.use(express.json());

        app.get("/", (req,res)=>{

            res.json({message:"Hello Task API!"});
        });
        // GET http://localhost:3000/user
        app.get("/user/:id",async (req,res)=>{
            try {

                const id = req.params.id;
                const user = await User.findByPk(id)
                
                const NewUser = await User.create({
                    
                    username: "billy",
                    email: "billy@gmail.com",
                    password: "azerty123"
                });

                res.json(user);
            } catch (error) {
                console.log(error);
                res.status(500).json({message: "Error Serveur"});  
            }
        });

        app.get("/post/:id",async (req,res)=>{
            const id = req.params.id;
            const post = await post.findByPk(id)

            const NewPost = await Post.create({
                title : "Premier titre",
                content: "Info du jour"
            })

            res.json(post);
        })

        app.get("/comment/:id",async (req,res)=>{
            const id = req.params.id;
            const comment = await comment.findByPk(id)

            const NewComment = await Comment.create({
                content: "Je commente",

            })

            res.json(comment);
        })



        

        

        app.listen(3000, () => {
            console.log("Serveur démarré sur http://localhost:3000");
        });


    } catch (error) {
        console.error("Error de chargement de Sequelize:", error);
    }
}
main();