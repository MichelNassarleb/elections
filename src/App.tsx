import React from 'react';
import logo from './logo.svg';
import './App.css';
import { initializeApp } from 'firebase/app'
import { HomeScreen } from './screens/Home/HomeScreen';
import { VotersScreen } from './screens/Voters/VotersScreen';
import NavigationContainer from './NavigationContainer';
const firebaseConfig = {
  apiKey: "AIzaSyBhpbW_0tPOa3TpgkRln67Pr22SroVuW_0",
  authDomain: "elections-1b5ba.firebaseapp.com",
  databaseURL: "https://elections-1b5ba-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "elections-1b5ba",
  storageBucket: "elections-1b5ba.firebasestorage.app",
  messagingSenderId: "696611958190",
  appId: "1:696611958190:web:0e39dc1c96dd5f2a8aec3f",
  measurementId: "G-RJPSC18PHD"
};

export const app = initializeApp(firebaseConfig);
function App() {


  return (
    <NavigationContainer />
  );
}

export default App;
