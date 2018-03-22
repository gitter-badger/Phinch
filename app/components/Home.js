// @flow
import React, { Component } from 'react';
// import { Link } from 'react-router-dom';

const path = require('path');
const { remote, clipboard } = require('electron');
const { dialog } = remote;
const { spawn, execFile } = require('child_process');

const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();

import { getProjects, getSamples } from '../projects.js';
import ProjectList from './ProjectList.js';
import LinkList from './LinkList.js';
import styles from './Home.css';
import logo from 'images/phinch.png';

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filename: '',
      datainfo: '',
      projects: getProjects(),
      samples: getSamples(),
    };

    this.showFilename = this.showFilename.bind(this);
    this.showFileInfo = this.showFileInfo.bind(this);
    this.onChosenFileToOpen = this.onChosenFileToOpen.bind(this);
    this.handleOpenButton = this.handleOpenButton.bind(this);
  }

  showFilename(filepath) {
    const filename = filepath.toString().split('/');
    this.setState({filename:filename[filename.length-1]});
  }

  uint8arrayToString(data){
    return String.fromCharCode.apply(null, data);
  };

  displayInfo(data) {
    const datainfo = JSON.stringify(data);
    this.setState({datainfo:datainfo});
  }

  showFileInfo(filepath) {
    const python = spawn(path.join(`${appPath}`,`/../biomhandler/dist/biomhandler`), [filepath]);
    let json = '';
    python.stdout.on('data', (data) => {
      json += this.uint8arrayToString(data);
    });
    python.stdout.on('end', () => {
      const data = JSON.parse(json);
      const shallowData = {};
      Object.keys(data).forEach((k) => {
        if ((typeof data[k] === 'number') || (typeof data[k] === 'string')) {
          shallowData[k] = data[k];
        }
      });
      this.displayInfo(shallowData);
    });
    python.stderr.on('data', (data) => {
      console.warn(this.uint8arrayToString(data));
    });
  }

  onChosenFileToOpen(filepath) {
    this.showFilename(filepath);
    this.showFileInfo(filepath);
  }

  handleOpenButton() {
    dialog.showOpenDialog({properties: ['openFile']}, (filepath) => {
      if (filepath) {
        this.onChosenFileToOpen(filepath.toString());
      }
    });
  }

  render() {
    // TODO: break down into componenets
    /*
            <h3>{this.state.filename}</h3>
            <button id='open' onClick={this.handleOpenButton}>Choose a file</button>
            <div>{this.state.datainfo}</div>
    */
    const links = LinkList();
    const projects = ProjectList(this.state.projects);
    const samples = ProjectList(this.state.samples);
    return (
      <div>
        <div className={styles.container} data-tid='container'>
          <div className={`${styles.section} ${styles.left}`}>
            <div className={`${styles.area} ${styles.about}`}>
              <img src={logo} alt='Phinch Logo' />
              <h1>Welcome to Phinch</h1>
              <p>version 0.01</p>
            </div>
            <div className={`${styles.area} ${styles.links}`}>
              {links}
            </div>
          </div>
          <div className={`${styles.section} ${styles.right}`}>
            <div className={styles.area}>
              <div className={styles.projectType}>
                <h2>Projects</h2>
              </div>
              {projects}
            </div>
            <div className={styles.area}>
              <div className={styles.projectType}>
                <h2>Samples</h2>
              </div>
              {samples}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
