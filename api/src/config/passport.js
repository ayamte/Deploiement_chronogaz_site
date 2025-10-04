const passport = require('passport');  
const GoogleStrategy = require('passport-google-oauth20').Strategy;  
const User = require('../models/User');  
const Role = require('../models/Role');  
const PhysicalUser = require('../models/PhysicalUser');  
const MoralUser = require('../models/MoralUser');  
  
passport.use(new GoogleStrategy({  
  clientID: process.env.GOOGLE_CLIENT_ID,  
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,  
  callbackURL: "/api/auth/google/callback"  
}, async (accessToken, refreshToken, profile, done) => {  
  try {  
    // Vérifier si l'utilisateur existe déjà  
    let user = await User.findOne({ email: profile.emails[0].value })  
      .populate('role_id', 'code nom');  
      
    if (user) {  
      // Utilisateur existant - vérifier si profil complet  
      const physicalUser = await PhysicalUser.findOne({ user_id: user._id });  
      const moralUser = await MoralUser.findOne({ user_id: user._id });  
        
      user.profileComplete = !!(physicalUser || moralUser);  
      return done(null, user);  
    }  
      
    // Nouvel utilisateur - créer avec infos minimales de Google  
    const clientRole = await Role.findOne({ code: 'CLIENT' });  
    const newUser = new User({  
      email: profile.emails[0].value,  
      password_hash: 'google_oauth',  
      role_id: clientRole._id,  
      statut: 'EN_ATTENTE', // En attente de complétion du profil  
      email_verified: true,  
      google_id: profile.id,
      created_by_admin: false 
    });  
      
    await newUser.save();  
    newUser.profileComplete = false;  
    newUser.googleProfile = {  
      name: profile.displayName,  
      given_name: profile.name?.givenName,  
      family_name: profile.name?.familyName,  
      picture: profile.photos?.[0]?.value  
    };  
      
    return done(null, newUser);  
  } catch (error) {  
    return done(error, null);  
  }  
}));