import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcrypt";

/**
 * 
 * @returns {Promise<Sequelize>}
 */
export async function loadSequelize() {
    try {
            // --Connexion au serveur mysql--
            // Connexion à la BDD
        const login = {
            database: "app-database",
            username: "root",
            password: "root"
        };
        const sequelize = new Sequelize("app-database", "root", "root", {
            host: '127.0.0.1',
            dialect: 'mysql'
        });

        //Créations des tables via models:
        const User = sequelize.define("User", {
            username: DataTypes.STRING,
            email: {
                type: DataTypes.STRING,
                set(value) {
                    this.setDataValue("email", value.trim().toLowerCase());
                }
            },
            password: {
                type: DataTypes.STRING,
                // Hook pour chiffrer le mot de passe avant de le sauvegarder
                // +
                set(clearPassword) {
                    if (clearPassword && !clearPassword.startsWith("$2b$")) {
                        // alors c'est un password non-hashé
                        const hashedPassword = bcrypt.hashSync(clearPassword, 10);
                        this.setDataValue('password', hashedPassword);
                    } else {
                        this.setDataValue('password', clearPassword);
                    }
                }
            }
        });

        const Post = sequelize.define("Post", {
            title: DataTypes.STRING,
            content: DataTypes.STRING,
        });

        const Comment = sequelize.define("Comment", {
            content: DataTypes.STRING,
        });

        // 2 Liaisons forme une Association
        User.hasMany(Post); // --{
        Post.belongsTo(User); // --||

        Post.hasMany(Comment);
        Comment.belongsTo(Post);

        User.hasMany(Comment);
        Comment.belongsTo(User);

        // Création des tables avant la fonction "sync" !

        await sequelize.sync ({ force: true});
        console.log("Connexion à la BDD effectuée");

        //Init fixtures data
        const userTest = await User.create ({
            username: "Alex",
            email: "alex@mail.com",
            password: "threadapi"
        });
        

            // -- Création des post --
        await userTest.createPost({ title : "Cloturer thread api", content: "Création des user" });
        await userTest.createPost ({ title : "Pouvoir créer des post", content: "Création des post"});
        await userTest.createPost ({ title: "Etre en mesure de commenter", content: "Création des comment"});

         //-- Création des comments -- 
        await userTest.createComment ({title: "Il faut cloturer l'api", content: "premier commentaire" });
        await userTest.createComment ({title: "les routes fonctionnent actuellement", content: "deuxieme commentaire" });
        await userTest.createComment ({title: "les commentaires sont affichés", content: "troisieme commentaire" });


        return sequelize;
    } catch (error) {
        console.error(error);
        throw Error("Échec du chargement de Sequelize");
    }

    // ...

}