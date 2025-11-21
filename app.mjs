import { loadSequelize } from "./database.mjs";
import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function isLoggedInJWT(User, JWT_SECRET) {
    return async (req, res, next) => {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            //Récupération de l'utilisateur connecté
            const user = await User.findByPk(decoded.userId);
            if (!user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
    }
}
async function main() {
    try {
        const sequelize = await loadSequelize();
        const User = sequelize.models.User;
        const Post = sequelize.models.Post;
        const Comment = sequelize.models.Comment;

        // Initialisation Express
        const app = express();

        //Middleware
        app.use(express.json());
        app.use(cookieParser());
        app.use(cors);

        //Route d'inscription
        app.post("/register", async (req, res) => {
            //Création d'un compte utilisateur (route publique)
            try {
                const { username, email, password, verifiedPassword } = req.body;

                //Vérification de la présence des champs requis
                if (!email || !password || !verifiedPassword || !username) {
                    return res.status(400).json({
                        message: "Email, password, verifiedPassword and username are required",
                    });
                }

                //Vérifie que les deux mot de passe corrrespondent
                if (password != verifiedPassword) { // bcrypt compare
                    return res.status(400).json({ message: "Password do not match" });
                }
                const emailNorm = email.trim().toLowerCase();

                // Création de l'utilisateur
                const user = await User.create({
                    email: emailNorm,
                    username,
                    password,
                });

                return res.status(201).json({
                    message: "User registered successfully",
                    userId: user.id,
                });
            } catch (error) {
                if (error.name === "SequelizeUniqueContraintError") {
                    return res.status(409).json({ message: "Email already exists" });
                }
                return res.status(500).json({ message: "Error registering user " });

            }
        });

        // Route de connexion 
        app.post("/login", async (req, res) => {
            // Connecte un utlisateur
            try {

                const { email, password } = request.body;
                const user = await User.findOne({ where: { email } });
                
                if (!user) {
                    return response.status(401).json({ error: "Email ou mot de passe incorrect" });
                }
                if (!bcrypt.compareSync(password, user.password)) {
                    return response.status(401).json({ error: "Email ou de passe incorrect" });
                }
                
                // Génére un token JWT lors de la connexion
                const token = jwt.sign(
                    { userId: user.id },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );
                
                // Envoie le token dans un cookie HttpOnly
                res.cookie("token", token, { httpOnly: true });
                res.json({ message: "Connexion réussie" });
            } catch (error) {
                console.log(error);
                res.status(500).json ({ error: "Erreur serveur"});                
            }

        });

        app.use(isLoggedInJWT(User, JWT_SECRET));



        app.get("/", (req, res) => {

            res.json({ message: "Hello Task API!" });
        });

        app.get("/users", async (req, res) => {
            try {
                const users = await User.findAll();
                res.json(users);

            } catch (error) {
                res.status(500).json({ error: "Erreur serveur" })
            }
        });

        app.post("/posts", async (req, res) => {
            try {
                console.log(req.body);
                const NewPostData = req.body;
                // test les champs title content
                const newPost = await Post.create({
                    title: NewPostData.title,
                    content: NewPostData.content,
                    UserId: req.user.id
                });
                res.json(newPost);
            } catch (error) {

                res.status(500).json({ error: "Erreur lors de la création du post" });
            }
        });

        app.get("/posts", async (req, res) => {
            try {
                const posts = await Post.findAll();
                res.json(posts);
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: "Erreur serveur" });
            }
        });

        app.post("/post/:postId/comments", async (req, res) => {
            try {
                console.log(req.params);
                const postId = req.params.postId;
                const comments = await Comment.findAll({
                    where: {
                        UserId: req.user.id,
                        PostId: postId,
                    }
                });
                res.json(comments);
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: "Erreur serveur" });
            }
        });

        app.delete("/posts/:postId", async (req, res) => {
            try {
                console.log(req.params);
                const postId = req.params.postId;
                const comments = await Comment.destroy({
                    where: {
                        PostId: postId,
                    }
                });
                res.json(comments);
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: "Erreur lors de la suppresion du post" });
            }
        });

        app.delete("/comment/:commentId", async (req, res) => {
            try {
                console.log(req.params);
                const commentId = req.params.commentId;
                const comments = await Comment.destroy({
                    where: {
                        CommentId: commentId,
                    }
                });
                res.json(comments);
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: "Erreur de la suppression du commentaire" });
            }
        });

        app.get("/user/:userId/posts", async (req, res) => {
            try {
                console.log(req.params);
                const userId = req.params.userId;
                req.user.getPosts();

                const posts = await Post.findAll({
                    where: {
                        UserId: userId,
                    }
                })

                res.json(posts);

            } catch (error) {
                console.log(error);
                req.status(401).json({ error: "Unauthorized" });

            }
        })

        // GET http://localhost:3000/user
        app.get("/user/:id", async (req, res) => {

            console.log(req.params);

            const userId = req.params.id;
            const user = await User.findByPk(userId);
            res.json(user);
        });


        app.post("/posts/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const posts = await Post.findByPk(id)
                const NewPostData = req.body;
                // test field title et content

                const NewPost = await Post.create({
                    title: "Premier titre",
                    content: "Info du jour"
                })

                res.json(NewPost);
            } catch (error) {
                res.status(500).json({
                    error: "Erreur lors de la création du post"
                });
            }
        })

        app.get("/comment/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const comment = await comment.findByPk(id);
                
                const NewComment = await Comment.create({
                    content: "Je commente",
                    
                })
                
                res.json(NewComment);
                
            } catch (error) {
                console.log(error);
                res.status(500).json({message:"Internal server error"});
                
            }
        })




        app.get("/logout", (req, res) => {
            res.clearCookie('token');
            res.json({ message: "Logout successful" });
        });

        app.listen(3000, () => {
            console.log("Serveur démarré sur http://localhost:3000");
        });


    } catch (error) {
        console.error("Error de chargement de Sequelize:", error);
    }
}
main();