import unittest,struct,sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from nasa_dynamo import decode,orbital_position

class DynamoTests(unittest.TestCase):
 def test_circular_orbit_and_scalar_first_orientation(self):
  row=[0,7000,0,2*math.pi/6000,0,1,0,0,0]
  payload=struct.pack('<h',2)+b'orb\0'+bytes([3])+struct.pack('<ddBi',0,398600.436,1,1)+struct.pack('<9d',*row)
  data=decode(payload);self.assertEqual(data.kind,'orb');self.assertEqual(data.header['gm2'],398600.436)
  point=orbital_position(data.tree['points'][0],1500)
  self.assertAlmostEqual(point[0],0,places=8);self.assertAlmostEqual(point[1],7000,places=8);self.assertEqual(point[2],0)
 def test_chunk_index_keeps_final_boundary_and_no_extrapolated_chunk(self):
  payload=struct.pack('<h',2)+b'pos\0'+bytes([2])+struct.pack('<Bi3d',0,3,0,100,200)
  data=decode(payload);self.assertEqual(data.tree['children'],[{'name':'00','start':0,'end':100},{'name':'01','start':100,'end':200}])
 def test_invalid_or_truncated_input_is_rejected(self):
  with self.assertRaises((ValueError,struct.error)):decode(b'bad')
 def test_hyperbolic_flyby_has_positive_periapsis_and_reversible_motion(self):
  row=[0,20000,1.5,.0001,0,1,0,0,0]
  self.assertAlmostEqual(orbital_position(row,0)[0],10000)
  before=orbital_position(row,-1000);after=orbital_position(row,1000)
  self.assertAlmostEqual(before[0],after[0]);self.assertAlmostEqual(before[1],-after[1]);self.assertGreater(math.hypot(*after),10000)
  almost_parabolic=[0,20000,1.000001,.0001,0,1,0,0,0]
  self.assertTrue(all(math.isfinite(value) for value in orbital_position(almost_parabolic,10)))

if __name__=='__main__':unittest.main()
