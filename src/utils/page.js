const forbiddenScroll = () => {
    document.body.style.overflow = 'hidden';
};

const allowScroll = () => {
    document.body.style.overflow = 'visible';
}


export {
    forbiddenScroll,
    allowScroll
}