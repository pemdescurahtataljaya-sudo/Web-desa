import InteractiveMap from '../components/InteractiveMap';
import { useEffect } from 'react';

const MapPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="map-page bg-light" style={{ minHeight: '100vh' }}>
      <InteractiveMap />
    </div>
  );
};

export default MapPage;
