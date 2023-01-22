import Container from 'react-bootstrap/Container'
import React, { useContext, useState, useEffect } from 'react';
import StatusWindow from '../components/StatusWindow';
import RosContext from "../context/ros-context";
import AuthContext from '../context/auth-context';
import TopicContext from '../context/topic-context';
import GraphWindow from '../components/GraphWindow';
import Row from 'react-bootstrap/esm/Row';
import Col from 'react-bootstrap/esm/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import AddVideoFeedPopup from '../components/AddVideoFeedPopup';
import VideoStream from '../components/VideoStream';

import './Main.css';


function ViewPage() {
    const contextRos = useContext(RosContext);
    const contextType = useContext(AuthContext);
    // A list of objects containing ROS topic, topic data, value recieved after subscribing and a boolean
    // value describing if the topic is ment for plotting.
    const [topicList, setTopicList] = useState([]);
    //A list of videofeed data
    const [videoFeedList, setVideoFeedList] = useState([]);

    //Hook used to check if there is at least one topic ment for ploting
    const [isGraphData, setIsGraphData] = useState(false);
    const [topics, setTopics] = useState([]);
    const [topicTypes, setTopicTypes] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState([]);
    const [selectedType, setSelectedType] = useState();
    const [width, setWidth] = useState(600);
    const [height, setHeight] = useState(400);

    //Hooks for displaying AddVideoFeedPopup
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handleVideoFeeePopup = (event) =>{
        event.preventDefault();
        handleShow(true)
    }   

    const SetTopics = (topics) => {
        setTopics(topics);
    };

    const SetTopicTypes = (topicTypes) => {
        setTopicTypes(topicTypes);
    }

    const SetSelectedTopic = (selectedTopic) => {
        setSelectedTopic(selectedTopic);
    }

    const SetSelectedType = (selectedType) => {
        setSelectedType(selectedType);
    }

    //function to add a videofeed to videofeedlist
    const addVideoFeedToList = (videoFeed) =>{
        setVideoFeedList([
            ...videoFeedList,
            videoFeed
        ]
        );
    }
    //function to delete a videofeed from videofeedlist
    const removeVideoFeedFromList = (videoFeedId) =>{
        //Tu kada trazis id vjv moras trazit pod videofeed[0]; Provjeri !
        let filteredArray = videoFeedList.filter(function (videofeed) { 
            return videofeed[0]._id !== videoFeedId
          });
        setVideoFeedList(filteredArray);
    }

    //svaki put kada se izmjeni lista topica pogledaj ako postoji topic za prikaz plotanja
    //ako postoji setiraj isGraphData na true ako ne postoji niti jeda setaj na false
    useEffect(() => {
        let isAnyTopicGraphData = false;
        topicList.map((data) => {
            if (data[1].isGraphData) {
                isAnyTopicGraphData = true;
            }
        });
        if (isAnyTopicGraphData) {
            setIsGraphData(true);
        } else {
            setIsGraphData(false);
        }
    }, [topicList]);

    useEffect(() => {
        //set the event listener to dinamicly resizes the canvas
        window.onresize = reportWindowSize;
        //call function to fetch videofeed data
        fetchVideoFeedData();

        //Get topics every 200 ms
        //see if this effects performanse in long run??
        const interval = setInterval(() => {
            contextRos.ros.getTopics(function (t) {
                SetTopics(t.topics);
                SetTopicTypes(t.types);
            })
        }, 200);
        return () => clearInterval(interval);
    }, []);

    //Function that fetches videofeed data (topics from which we stream videos)
    const fetchVideoFeedData = async () =>{
        const requestBody = {
            query: `
            query{
                videoFeeds(robotId:"${contextRos.robotId}"){
                  _id
                  topicName
                  windowName
                  robotId
                }
              }
            `
          };
          const token = contextType.token;
          try {
            const res = await fetch("http://localhost:8000/graphql", {
              method: "POST",
              body: JSON.stringify(requestBody),
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
              }
            });
      
            if (res.status !== 200 && res.status !== 201) {
              throw new Error("Faild!");
            } else {
              let data = await res.json();
              if (data) {
                //Dodaj polje u objektu koje ce sadrzavat viewera
                let viewer = {};
                let VideoFeedObjects = data.data.videoFeeds.map((videofeed)=>{
                    return [videofeed, viewer];
                });
                setVideoFeedList(VideoFeedObjects);
              }
            }
          } catch (err) {
            throw err;
          }
    }

        // Function that dinamicly resizes the canvas
        const reportWindowSize = (e) => {      
            let WW =  window.outerWidth ;
            if(WW<500){
                //xs
                setWidth(312);
                setHeight(312);
            }else if(WW>=500 && WW < 768){
               //sm
               setWidth(460);
               setHeight(312);
            }else if(WW>=768 && WW<992){
               //md 
               setWidth(300);
               setHeight(312);
            }else if(WW >=992 && WW<1200){
                //l
                setWidth(420);
                setHeight(312);
            }else if(WW >=1200 && WW <1400){
                //xl
                setWidth(500);
                setHeight(400);
            }else if(WW >1400){
                //xxl
                setWidth(612);
                setHeight(400);
            }
          }
        

    return (
        <Container className="page-position h-100">
            <TopicContext.Provider value={{
                topics: topics,
                topicTypes: topicTypes,
                selectedTopic: selectedTopic,
                selectedType: selectedType,
                setSelectedType: SetSelectedType,
                setTopics: SetTopics,
                setTopicTypes: SetTopicTypes,
                setSelectedTopic: SetSelectedTopic
            }}>
                <Dropdown className='mb-2'>
                    <Dropdown.Toggle variant="primary" id="dropdown-basic">
                        <span style={{"marginRight":"5px"}}>Add funtionalities</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                        </svg>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item id="t1" onClick={handleVideoFeeePopup}>Add video feed</Dropdown.Item>
                        <Dropdown.Item id="t1">Add point cloud</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                <AddVideoFeedPopup show={show} addVideoFeedToList={addVideoFeedToList} handleClose={handleClose} />

                <Row xs={1} md={2} lg={2}>
                    <Col>
                        <StatusWindow topicList={topicList} setIsGraphData={setIsGraphData} setTopicList={setTopicList} />
                    </Col>
                    {//Show graph only when graph data available.
                        isGraphData &&
                        <Col>
                            <GraphWindow topicList={topicList}></GraphWindow>
                        </Col>}
                </Row>
                <Row xs={1} md={2} lg={2}>
                    {videoFeedList.length > 0 &&
                    videoFeedList.map((videoFeed,index)=>{
                        return(
                            <Col id={"VideoFeedCol"+index} key={index}>
                                <VideoStream width ={width} height={height} removeVideoFeedFromList={removeVideoFeedFromList} videoFeed={videoFeed}></VideoStream>
                            </Col>
                        );
                    })
                    }
                </Row>
            
            </TopicContext.Provider>
        </Container>
    );
}

export default ViewPage;