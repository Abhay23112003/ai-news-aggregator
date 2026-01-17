import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    
    const response = await fetch(`${BACKEND_URL}/articles?limit=${limit}`, {
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function PATCH(request:Request) {
  try {
    const body=await request.json()
    const {article_id,is_bookmarked}=body;

    const response=await fetch(`${BACKEND_URL}/bookmark`,{
      method:'PATCH',
      headers:{
        'Content-Type':'application/json',
      },
      body:JSON.stringify({
        article_id:article_id,
        is_bookmarked:is_bookmarked,
      }),
    });

    if(!response.ok){
      const errorData=await response.json()
      return NextResponse.json(
        {error:errorData || 'Failed to update bookmark'},
        {status:response.status}
      );
    }
    const data=await response.json();
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in updating bookmark')
    return NextResponse.json(
      {error:'Internal server error'},
      {status:500}
    )
  }
}

