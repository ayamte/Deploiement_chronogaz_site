const nodemailer = require('nodemailer');    
  
const transporter = nodemailer.createTransport({  
  host: process.env.SMTP_HOST || 'smtp.gmail.com',    
  port: process.env.SMTP_PORT || 587,    
  secure: false,    
  auth: {    
    user: process.env.SMTP_USER,    
    pass: process.env.SMTP_PASS    
  }    
});    
  
const sendPasswordResetEmail = async (email, resetToken) => {    
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;    
      
  const mailOptions = {    
    from: process.env.SMTP_USER,    
    to: email,    
    subject: 'ChronoGaz - Réinitialisation de mot de passe',    
    html: `    
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">    
        <h2 style="color: #1f55a3;">Réinitialisation de votre mot de passe</h2>    
        <p>Vous avez demandé la réinitialisation de votre mot de passe ChronoGaz.</p>    
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>    
        <a href="${resetUrl}" style="background-color: #1f55a3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">    
          Réinitialiser mon mot de passe    
        </a>    
        <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>    
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>    
      </div>    
    `    
  };    
  
  await transporter.sendMail(mailOptions);    
};    
  
const sendVerificationEmail = async (email, verificationCode) => {    
  const mailOptions = {    
    from: process.env.SMTP_USER,    
    to: email,    
    subject: 'ChronoGaz - Vérification de votre compte',    
    html: `    
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">    
        <h2 style="color: #1f55a3;">Bienvenue sur ChronoGaz !</h2>    
        <p>Merci de vous être inscrit sur ChronoGaz. Pour activer votre compte, veuillez utiliser le code de vérification suivant :</p>    
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">    
          <h1 style="color: #1f55a3; font-size: 32px; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>    
        </div>    
        <p>Ce code expire dans 15 minutes.</p>    
        <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>    
      </div>    
    `    
  };    
  
  await transporter.sendMail(mailOptions);    
};    
  
const sendTempPasswordEmail = async (email, tempPassword, firstName) => {  
  const mailOptions = {  
    from: process.env.SMTP_USER,  
    to: email,  
    subject: 'ChronoGaz - Vos identifiants de connexion',  
    html: `  
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">  
        <h2 style="color: #1f55a3;">Bienvenue sur ChronoGaz !</h2>  
        <p>Bonjour ${firstName},</p>  
        <p>Votre compte a été créé par votre entreprise. Voici vos identifiants de connexion :</p>  
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #1f55a3;">  
          <p><strong>Email :</strong> ${email}</p>  
          <p><strong>Mot de passe temporaire :</strong> <span style="font-family: monospace; background-color: #e8e8e8; padding: 4px 8px; border-radius: 4px;">${tempPassword}</span></p>  
        </div>  
        <p style="color: #d32f2f;"><strong>Important :</strong> Vous devrez changer ce mot de passe lors de votre première connexion pour des raisons de sécurité.</p>  
        <p>Connectez-vous sur : <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="color: #1f55a3;">ChronoGaz</a></p>  
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé la création de ce compte, contactez votre entreprise.</p>  
      </div>  
    `  
  };  
    
  await transporter.sendMail(mailOptions);  
};  
  
module.exports = {   
  sendPasswordResetEmail,   
  sendVerificationEmail,   
  sendTempPasswordEmail   
};