import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RecordCategory, RecordFormat } from './record.enum';

@Schema({
  timestamps: true,
})
export class Record extends Document {
  @Prop({ required: true, index: true })
  artist: string;

  @Prop({ required: true, index: true })
  album: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ required: true, index: true })
  format: RecordFormat;

  @Prop({ required: true, index: true })
  category: RecordCategory;

  @Prop()
  mbid?: string;

  @Prop([String])
  tracklist: string[];
}

export const RecordSchema = SchemaFactory.createForClass(Record);

RecordSchema.set('toJSON', {
  versionKey: false, // remove __v
  transform: (_, ret) => {
    ret.id = ret._id; // rename _id → id
    delete ret._id;
    return ret;
  },
});
RecordSchema.index({ artist: 1, album: 1, format: 1 }, { unique: true });
RecordSchema.index({ category: 1, format: 1, artist: 1, album: 1 });
