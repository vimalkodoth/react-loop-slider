import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect
} from "react";
import "./styles.css";
import data from "./data.json";
import { useScroll, useDrag } from "react-use-gesture";
import { animated, useSpring } from "react-spring";
import { Transition } from "react-transition-group";

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  let rtime;
  let timeout = false;
  let delta = 500;
  let timeoutInstance = null;

  function updateSize() {
    setSize([window.innerWidth, window.innerHeight]);
  }

  const resizeend = () => {
    if (new Date() - rtime < delta) {
      setTimeout(resizeend, delta);
    } else {
      timeout = false;
      updateSize();
    }
  };
  const onResizeEnd = () => {
    rtime = new Date();
    if (timeout === false) {
      timeout = true;
      if (timeoutInstance) clearTimeout(timeoutInstance);
      timeoutInstance = setTimeout(resizeend, delta);
    }
  };
  useLayoutEffect(() => {
    window.addEventListener("resize", onResizeEnd);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

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
  const [width, height] = useWindowSize();

  const [style, set] = useSpring(() => ({
    transform: "perspective(500px) rotateY(0deg)",
    opacity: 1
  }));

  useEffect(() => {
    setObsOptions({
      rootMargin: "0px",
      threshold: 0.9
    });
  }, []);

  useEffect(() => {
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
  }, [initialRenderCount, width]);

  const firstElementRef = useCallback(node => {
    if (node) {
      console.log(node);
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
    if (rendered.length && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const element = containerRef.current.querySelector("li:first-child");
      const style = element.currentStyle || window.getComputedStyle(element);
      const elementWidth =
        element.offsetWidth +
        (parseFloat(style.marginLeft) + parseFloat(style.marginRight));
      const renderViewCount = Math.floor(containerWidth / elementWidth);
      console.log(`[render] viewCount ${renderViewCount}`);
      setSlideStyles(transform(-(elementWidth * renderViewCount), 0));
      setSlidePos(-(elementWidth * renderViewCount));
      setInitialRenderCount(renderViewCount);
      setContainerWidth(containerWidth);
      setScrollWidth(elementWidth * channelsCount);
      setElementWidth(elementWidth);
    }
  }, [rendered, channelsCount, width, height]);

  const onClicked = (e, item) => {
    e.persist();
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
    const element = e.target;
    const elementLeft = e.target.offsetLeft + slidePos;
    debugger;
    const elementCenter = elementLeft + Math.floor(element.offsetWidth / 2);
    const wrapperCenter = Math.floor(containerWidth / 2);
    if (wrapperCenter > elementCenter) {
      setSlidePos(prevPos => {
        return prevPos + (wrapperCenter - elementCenter);
      });
      setSlideStyles(
        transform(slidePos + (wrapperCenter - elementCenter), 0.25)
      );
    } else if (elementCenter > wrapperCenter) {
      setSlidePos(prevPos => {
        debugger;
        return prevPos - (elementCenter - wrapperCenter);
      });
      setSlideStyles(
        transform(slidePos - (elementCenter - wrapperCenter), 0.25)
      );
    }
  };

  const onRightEndView = () => {
    setSlideStyles(transform(-containerWidth, 0));
    setSlidePos(-containerWidth);
    // setCurr(0);
  };
  const onLeftEndView = () => {
    setSlideStyles(transform(-scrollWidth, 0));
    setSlidePos(-scrollWidth);
  };

  const [{ x, y }, setXY] = useSpring(() => ({ x: 0, y: 0 }));

  const bind = useDrag(({ down, movement: [mx, my] }) => {
    setXY({ x: down ? mx : 0, y: down ? my : 0 });
    console.log(down);
    console.log(x);
    console.log(y);
  });

  const ChannelItem = React.forwardRef((props, ref) => {
    const { item, index: key } = props;
    return (
      <li
        key={`${item.channelId}_${key}`}
        ref={ref}
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          listStyle: "none",
          height: "180px",
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
  });

  const onWheelList = delta => {
    requestAnimationFrame(() => {
      delta > 0 ? scrollLeft() : scrollRight();
    });
  };

  return (
    <div>
      <div
        style={{ height: "180px", marginBottom: "20px" }}
        className={`wrapper`}
        ref={containerRef}
      >
        <ul style={slideStyles} onWheel={e => onWheelList(e.deltaY)}>
          {rendered.map((item, key) => {
            if (key === rendered.length - 1) {
              return (
                <ChannelItem
                  ref={lastElementRef}
                  item={item}
                  key={key}
                  index={key}
                />
              );
            }
            if (key === 0) {
              return (
                <ChannelItem
                  ref={firstElementRef}
                  item={item}
                  key={key}
                  index={key}
                />
              );
            }
            return <ChannelItem item={item} key={key} index={key} />;
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
