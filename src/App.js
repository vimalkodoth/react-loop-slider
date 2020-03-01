import React, { useState, useEffect, useRef, useCallback } from "react";
import "./styles.css";
import data from "./data.json";
import { useScroll } from "react-use-gesture";
import { animated, useSpring } from "react-spring";
import { Transition } from "react-transition-group";

const transform = (pos, transitionDelay) => {
  return {
    transform: `translateX(${pos}px)`,
    transition: `transform ${transitionDelay}s ease-in`
  };
};
const List = data => {
  const [initialRenderCount, setInitialRenderCount] = useState(0);
  const containerRef = useRef(null);
  const [slidePos, setSlidePos] = useState(0);
  const [slideStyles, setSlideStyles] = useState(transform(slidePos, 0.5));
  const [endReached, setEndReached] = useState(false);
  const [channelsCount, setChannelsCount] = useState(data.data.length);
  const [curr, setCurr] = useState(0);
  const [rendered, setRendered] = useState([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [elementWidth, setElementWidth] = useState(0);
  const [obsOptions, setObsOptions] = useState(null);
  const leftObserver = useRef(null);
  const rightObserver = useRef(null);

  const [style, set] = useSpring(() => ({
    transform: "perspective(500px) rotateY(0deg)",
    opacity: 1
  }));

  useEffect(() => {
    setObsOptions({
      rootMargin: "0px",
      threshold: 1.0
    });
  }, []);

  useEffect(() => {
    console.log(initialRenderCount);
    console.log("pos " + slidePos);
    const channels = data.data.slice(0);
    channels.sort((a, b) => {
      return parseInt(a.number) - parseInt(b.number);
    });
    const prependChannels = channels.slice(
      Math.max(channels.length - initialRenderCount, 0)
    );
    const appendChannels = channels.slice(0, initialRenderCount);
    channels.unshift(...prependChannels);
    channels.push(...appendChannels);
    setRendered(channels);
  }, [initialRenderCount]);

  const firstElementRef = useCallback(node => {
    if (node) {
      if (leftObserver.current) leftObserver.current.disconnect();
      leftObserver.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setEndReached(true);
          onLeftEndView();
        }
      }, obsOptions);
      leftObserver.current.observe(node);
    }
  });

  const lastElementRef = useCallback(node => {
    if (node) {
      if (rightObserver.current) rightObserver.current.disconnect();
      rightObserver.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setEndReached(true);
          onRightEndView();
        }
      }, obsOptions);
      rightObserver.current.observe(node);
    }
  });
  useEffect(() => {
    if (!endReached) {
      setSlideStyles(transform(slidePos, 0.25));
    }
  }, [endReached, slidePos]);

  useEffect(() => {
    console.log(rendered);
    if (rendered.length && containerRef.current) {
      console.log(containerRef.current);
      const containerWidth = containerRef.current.offsetWidth;
      const element = containerRef.current.querySelector("li:first-child");
      const style = element.currentStyle || window.getComputedStyle(element);
      const elementWidth =
        element.offsetWidth +
        (parseFloat(style.marginLeft) + parseFloat(style.marginRight));
      console.log(containerWidth + " " + elementWidth);
      console.log(Math.floor(containerWidth / elementWidth));
      const renderViewCount = Math.floor(containerWidth / elementWidth);
      setSlideStyles(transform(-(elementWidth * renderViewCount), 0));
      setSlidePos(-(elementWidth * renderViewCount));
      setInitialRenderCount(renderViewCount);
      setContainerWidth(containerWidth);
      setScrollWidth(elementWidth * channelsCount);
      setElementWidth(elementWidth);
      console.log("render count set");
    }
  }, [rendered, channelsCount]);

  const onClicked = (e, item) => {
    e.persist();
    console.log(item);
    slideToCenter(e);
  };

  const scrollLeft = () => {
    setEndReached(false);
    setSlidePos(prevPos => prevPos - elementWidth);
    setCurr(prevCurr => prevCurr + 1);
  };

  const scrollRight = () => {
    setEndReached(false);
    setSlidePos(prevPos => prevPos + elementWidth);
    setCurr(prevCurr => prevCurr - 1);
  };

  const slideToCenter = e => {
    console.log(e.target);
    const element = e.target;
    const elementLeft = e.target.offsetLeft + slidePos;
    debugger;
    const elementCenter = elementLeft + Math.floor(element.offsetWidth / 2);
    const wrapperCenter = Math.floor(containerWidth / 2);
    console.log(elementLeft + " " + elementCenter + " " + wrapperCenter);
    if (wrapperCenter > elementCenter) {
      setSlidePos(prevPos => {
        return prevPos + (wrapperCenter - elementCenter);
      });
      setSlideStyles(transform(slidePos + (wrapperCenter - elementCenter), 0));
    } else if (elementCenter > wrapperCenter) {
      setSlidePos(prevPos => {
        debugger;
        return prevPos - (elementCenter - wrapperCenter);
      });
      setSlideStyles(transform(slidePos - (elementCenter - wrapperCenter), 0));
    }
  };

  const onRightEndView = () => {
    setSlideStyles(transform(-containerWidth, 0));
    setSlidePos(-containerWidth);
    // setCurr(0);
  };
  const onLeftEndView = () => {
    console.log("set");
    setSlideStyles(transform(-scrollWidth, 0));
    setSlidePos(-scrollWidth);
  };

  return (
    <div>
      <div style={{ height: "100px" }} className={`wrapper`} ref={containerRef}>
        <ul style={slideStyles}>
          {rendered.map((item, key) => {
            if (key === rendered.length - 1) {
              return (
                <li
                  key={`${item.channelId}_${key}`}
                  ref={lastElementRef}
                  style={{
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    listStyle: "none",
                    width: "100px",
                    height: "50px",
                    backgroundColor: "yellow",
                    margin: "5px",
                    cursor: "pointer",
                    ...style
                  }}
                  onClick={e => onClicked(e, item, key)}
                >
                  {item.number}
                  {/* <img
                    alt=""
                    src={item.imageList[1].url}
                    style={{ width: "100%" }}
                  /> */}
                </li>
              );
            }
            if (key === 0) {
              return (
                <li
                  key={`${item.channelId}_${key}`}
                  id="first"
                  ref={firstElementRef}
                  style={{
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    listStyle: "none",
                    width: "100px",
                    height: "50px",
                    backgroundColor: "yellow",
                    margin: "5px",
                    cursor: "pointer",
                    ...style
                  }}
                  onClick={e => onClicked(e, item, key)}
                >
                  {item.number}
                  {/* <img
                    alt=""
                    src={item.imageList[1].url}
                    style={{ width: "100%" }}
                  /> */}
                </li>
              );
            }
            return (
              <li
                key={`${item.channelId}_${key}`}
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  listStyle: "none",
                  width: "100px",
                  height: "50px",
                  backgroundColor: "yellow",
                  margin: "5px",
                  cursor: "pointer",
                  ...style
                }}
                onClick={e => onClicked(e, item, key)}
              >
                {item.number}
                {/* <img
                  alt=""
                  src={item.imageList[1].url}
                  style={{ width: "100%" }}
                /> */}
              </li>
            );
          })}
        </ul>
      </div>
      <button id="next" onClick={scrollRight}>
        Up
      </button>
      <button id="down" onClick={scrollLeft}>
        Down
      </button>
    </div>
  );
};
export default function App() {
  return (
    <div className="App">
      <List data={data} />
    </div>
  );
}
