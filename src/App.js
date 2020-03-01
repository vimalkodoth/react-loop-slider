import React, { useState, useEffect, useRef, useCallback } from "react";
import "./styles.css";
import data from "./data.json";
import { useScroll } from "react-use-gesture";
import { animated, useSpring } from "react-spring";
import { Transition } from "react-transition-group";

// function mod(n, m) {
//   return ((n % m) + m) % m;
// }

// const init = function(data) {
//   if (data.length >= 7) {
//     return {
//       focusedIndex: 0,
//       activeIndex: 0,
//       endIndex: mod(1, data.length),
//       startIndex: mod(data.length - 5, data.length)
//     };
//   } else {
//     return {
//       focusedIndex: 0,
//       activeIndex: 0,
//       startIndex: 0,
//       endIndex: mod(1, data.length)
//     };
//   }
// };

// var renderdown = function(data, current) {
//   const currentConfig = {};
//   if (current.startIndex === 0) {
//     currentConfig.startIndex = data.length - 1;
//   } else {
//     currentConfig.startIndex = current.startIndex - 1;
//   }
//   if (current.endIndex === 0) {
//     currentConfig.endIndex = data.length - 1;
//   } else {
//     currentConfig.endIndex = current.endIndex - 1;
//   }
//   if (current.endIndex === 0) {
//     currentConfig.focusedIndex = data.length - 1;
//   } else {
//     currentConfig.focusedIndex = current.endIndex - 1;
//   }
//   return currentConfig;
// };
// var renderup = function(data, current) {
//   const currentConfig = {};
//   if (current.startIndex === data.length - 1) {
//     currentConfig.startIndex = 0;
//   } else {
//     currentConfig.startIndex = current.startIndex + 1;
//   }
//   if (current.endIndex === data.length - 1) {
//     currentConfig.endIndex = 0;
//   } else {
//     currentConfig.endIndex = current.endIndex + 1;
//   }
//   if (current.endIndex === 0) {
//     currentConfig.focusedIndex = data.length - 1;
//   } else {
//     currentConfig.focusedIndex = current.endIndex - 1;
//   }
//   return currentConfig;
// };

// const populateInitial = (data, current) => {
//   console.log(data);
//   console.log(current);
//   const arr = [];
//   if (data.length > 7) {
//     if (current.endIndex > current.startIndex) {
//       for (let i = current.startIndex; i <= current.endIndex; i++) {
//         arr.push(data[i]);
//       }
//     } else if (current.endIndex < current.startIndex) {
//       for (let i = current.startIndex; i <= data.length - 1; i++) {
//         arr.push(data[i]);
//       }
//       for (let i = 0; i <= current.startIndex - 1; i++) {
//         arr.push(data[i]);
//       }
//     }
//   } else {
//     if (current.endIndex > current.startIndex) {
//       for (let i = current.startIndex; i <= current.endIndex; i++) {
//         arr.push(data[i]);
//       }
//       for (let i = current.endIndex + 1; i < data.length; i++) {
//         arr.push(data[i]);
//       }
//       for (let i = 0; i < current.startIndex; i++) {
//         arr.push(data[i]);
//       }
//     } else {
//       for (let i = current.startIndex; i < data.length; i++) {
//         arr.push(data[i]);
//       }
//       for (
//         let i = 0;
//         i <= current.endIndex && current.startIndex !== current.endIndex;
//         i++
//       ) {
//         arr.push(data[i]);
//       }
//       for (let i = current.endIndex + 1; i < current.startIndex; i++) {
//         arr.push(data[i]);
//       }
//     }
//   }
//   return arr;
// };
// const throttle = (func, limit) => {
//   let lastFunc;
//   let lastRan;
//   return function() {
//     const context = this;
//     const args = arguments;
//     if (!lastRan) {
//       func.apply(context, args);
//       lastRan = Date.now();
//     } else {
//       clearTimeout(lastFunc);
//       lastFunc = setTimeout(function() {
//         if (Date.now() - lastRan >= limit) {
//           func.apply(context, args);
//           lastRan = Date.now();
//         }
//       }, limit - (Date.now() - lastRan));
//     }
//   };
// };

const transform = (pos, transitionDelay) => {
  return {
    transform: `translateX(${pos}px)`,
    transition: `transform ${transitionDelay}s ease-in`
  };
};
const List = data => {
  const [initialRenderCount, setInitialRenderCount] = useState(0);
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

  const leftObserver = useRef(null);
  const rightObserver = useRef(null);
  const firstElementRef = useCallback(node => {
    const options = {
      root: containerRef.current.querySelector("ul"),
      rootMargin: "0px",
      threshold: 1.0
    };

    if (node) {
      if (leftObserver.current) leftObserver.current.disconnect();
      leftObserver.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          //setTimeout(() => {
          console.log("left end");
          setEndReached(true);
          onLeftEndView();
          // }, 500);
        }
      });
      leftObserver.current.observe(node);
    }
  });

  const lastElementRef = useCallback(node => {
    if (node) {
      if (rightObserver.current) rightObserver.current.disconnect();
      rightObserver.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          //setTimeout(() => {
          console.log("right end");
          setEndReached(true);
          onRightEndView();
          //}, 500);
        }
      });
      rightObserver.current.observe(node);
    }
  });

  const [slidePos, setSlidePos] = useState(0);
  const [slideStyles, setSlideStyles] = useState(transform(slidePos, 0.5));
  const [endReached, setEndReached] = useState(false);
  const [channelsCount, setChannelsCount] = useState(data.data.length);
  const [curr, setCurr] = useState(0);
  //console.log(channels);
  const [rendered, setRendered] = useState([]);

  const [containerWidth, setContainerWidth] = useState(0);

  const [scrollWidth, setScrollWidth] = useState(0);

  const [elementWidth, setElementWidth] = useState(0);

  const [actualRenderWidth, setActualRenderWidth] = useState(0);

  const [style, set] = useSpring(() => ({
    transform: "perspective(500px) rotateY(0deg)",
    opacity: 1
  }));

  const [initialScrollLeft, setInitialScrollLeft] = useState(0);
  // useEffect(() => {
  //   console.log("here");
  //   console.log(slidePos + " " + -scrollWidth + " " + -elementWidth);
  //   const virtualRightStartPos =
  //     initialScrollLeft - actualRenderWidth - elementWidth;
  //   console.log(virtualRightStartPos);
  //   console.log(slidePos);
  //   if (
  //     slidePos === initialScrollLeft - scrollWidth - elementWidth ||
  //     slidePos === initialScrollLeft + elementWidth ||
  //     slidePos === virtualRightStartPos ||
  //     slidePos === elementWidth ||
  //     slidePos === -scrollWidth
  //   ) {
  //     return;
  //   }
  //   setSlideStyles(transform(slidePos, 0.25));
  // }, [slidePos]);

  useEffect(() => {
    if (!endReached) {
      setSlideStyles(transform(slidePos, 0.25));
    }
  }, [endReached, slidePos]);

  const containerRef = useRef(null);

  const [direction, setDirection] = useState("");

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
      setInitialScrollLeft(-(elementWidth * renderViewCount));
      setInitialRenderCount(renderViewCount);
      setActualRenderWidth(elementWidth * channelsCount);
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
    console.log("left");
    console.log(slidePos);
    //console.log(channelsCount);
    setEndReached(false);
    setSlidePos(prevPos => prevPos - elementWidth);
    setCurr(prevCurr => prevCurr + 1);
  };

  const scrollRight = () => {
    console.log("right");
    console.log(curr);
    console.log(channelsCount);
    console.log("setting");
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
    // console.log("transitionend");
    // console.log(curr);
    // console.log(channelsCount + 1);
    console.log("set");
    setSlideStyles(transform(-scrollWidth, 0));
    setSlidePos(-scrollWidth);
    // setCurr(channelsCount - (initialRenderCount - 1));
    // if (curr === channelsCount) {
    //   console.log("reset");
    //   setSlideStyles(transform(-containerWidth, 0));
    //   setSlidePos(-containerWidth);
    //   setCurr(0);
    // } else if (curr === -initialRenderCount) {
    //   console.log("set");
    //   setSlideStyles(transform(-scrollWidth, 0));
    //   setSlidePos(-scrollWidth);
    //   setCurr(channelsCount - (initialRenderCount - 1));
    // }
  };

  const onTransitionEnd = () => {
    // console.log("transitionend");
    // console.log(curr);
    // console.log(channelsCount + 1);
    if (curr === channelsCount) {
      console.log("reset");
      setSlideStyles(transform(-containerWidth, 0));
      setSlidePos(-containerWidth);
      setCurr(0);
    } else if (curr === -initialRenderCount) {
      console.log("set");
      setSlideStyles(transform(-scrollWidth, 0));
      setSlidePos(-scrollWidth);
      setCurr(channelsCount - (initialRenderCount - 1));
    }
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
