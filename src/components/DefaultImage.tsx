import React from 'react';
import { Image } from '@chakra-ui/react';

const DefaultImage = () => {
  return (
    // <Image
    //   src="https://www.gifs.cc/christmas/2022-merry-christmas-animated-puppies.gif"
    //   alt="Dan Abramov"
    // />
    // <Image
    //   src="https://media.tenor.com/K6E74DP8JWgAAAAi/happy-sumikko-gurashi.gif"
    //   alt="happy new year"
    // />
    // <div>
    //   <Image
    //     src="https://i.pinimg.com/originals/27/66/ab/2766ab19e30e26a3dcf20273d3f0faa9.gif"
    //     alt="spring"
    //     height="85%"
    //   />
    // </div>
    <div style={{ marginTop: '-20px' }}>
      <Image src="/moon-rabbi.gif" alt="mother's day" height="85%" />
    </div>
  );
};

export default DefaultImage;
